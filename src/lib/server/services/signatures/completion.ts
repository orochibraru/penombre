import { and, asc, eq, isNull } from "drizzle-orm";
import {
	type SignatureRequest,
	type SignatureSigner,
	signatureEvents,
	signatureRequests,
} from "#lib/server/db/schema.js";
import { originalKey, SignatureBase, signedKey, who } from "./base";
import { buildSignedPdf, sha256 } from "./pdf";

/** Everyone has signed: the signed PDF, and telling everybody. */
export class SignatureCompletion extends SignatureBase {
	/** In order: the next signer's turn has come, so their link is emailed. */
	protected async advance(request: SignatureRequest): Promise<void> {
		const next = (await this.signersOf(request.id)).find(
			(s) => s.status === "pending",
		);
		const send = next ? await this.deps.mailer() : null;
		if (!(next && send)) {
			return;
		}
		const emailed = await this.invite(
			send,
			request,
			next,
			await this.rotate(next.id),
		);
		await this.log(request.id, [
			{
				type: "sent",
				signerId: next.id,
				actor: who(next),
				detail: emailed ? "their turn, by email" : "their turn; email failed",
			},
		]);
	}

	/**
	 * Builds the signed PDF once everyone has signed. Idempotent, and safe to
	 * run twice at once: each build lands under its own hash and only the
	 * first to record its hash sends anything. A build that failed is retried
	 * by the next download.
	 */
	async finalize(
		id: string,
		keep?: { signerId: string; token: string },
	): Promise<void> {
		let [request] = await this.db
			.select()
			.from(signatureRequests)
			.where(eq(signatureRequests.id, id))
			.limit(1);
		if (
			!request ||
			request.signedHash ||
			(request.status !== "pending" && request.status !== "completed")
		) {
			return;
		}
		const signers = await this.signersOf(id);
		if (signers.some((signer) => signer.status !== "signed")) {
			return;
		}
		if (request.status === "pending") {
			[request] = await this.db
				.update(signatureRequests)
				.set({ status: "completed", completedAt: new Date() })
				.where(
					and(
						eq(signatureRequests.id, id),
						eq(signatureRequests.status, "pending"),
					),
				)
				.returning();
			if (!request) {
				return;
			}
			await this.log(id, [{ type: "completed" }]);
		}
		const bytes = await this.build(request, signers);
		if (!bytes) {
			return;
		}
		const hash = sha256(bytes);
		await this.deps.store.write(signedKey(id, hash), bytes);
		const [won] = await this.db
			.update(signatureRequests)
			.set({ signedHash: hash })
			.where(
				and(eq(signatureRequests.id, id), isNull(signatureRequests.signedHash)),
			)
			.returning();
		if (won) {
			await this.announce(won, signers, bytes, keep);
		}
	}

	private async build(
		request: SignatureRequest,
		signers: SignatureSigner[],
	): Promise<Uint8Array | null> {
		const original = await this.deps.store.read(originalKey(request.id));
		if (!original) {
			this.deps.warn(`Signature request ${request.id} lost its frozen PDF`);
			return null;
		}
		const events = await this.db
			.select()
			.from(signatureEvents)
			.where(eq(signatureEvents.requestId, request.id))
			.orderBy(asc(signatureEvents.createdAt), asc(signatureEvents.id));
		return await buildSignedPdf(original, {
			requestId: request.id,
			documentName: request.documentName,
			documentHash: request.documentHash,
			pageCount: request.pageCount,
			requester: who(await this.person(request.ownerId)),
			createdAt: request.createdAt,
			completedAt: request.completedAt ?? new Date(),
			signers: signers.map((signer) => ({
				name: signer.name,
				email: signer.email,
				signature: signer.signature ?? "",
				signedAt: signer.respondedAt ?? new Date(),
				timeZone: signer.timeZone,
				ipAddress: signer.ipAddress,
				userAgent: signer.userAgent,
				account: signer.userId !== null,
			})),
			events: events.map((event) => ({
				at: event.createdAt,
				type: event.type,
				actor: event.actor,
				detail: event.detail,
				ipAddress: event.ipAddress,
			})),
		});
	}

	/** Files it, tells the requester, and mails every signer a download link. */
	private async announce(
		request: SignatureRequest,
		signers: SignatureSigner[],
		bytes: Uint8Array,
		keep?: { signerId: string; token: string },
	): Promise<void> {
		await this.deps.saveSigned(request, bytes).catch((error: unknown) => {
			this.deps.warn(`Could not file the signed PDF of ${request.id}`, error);
		});
		await this.deps.notify({
			userId: request.ownerId,
			type: "signature_completed",
			resourceName: request.documentName,
			link: "/signatures",
		});
		const send = await this.deps.mailer();
		if (!send) {
			return;
		}
		for (const signer of signers) {
			// The one signing now is on the page: their link must keep working.
			const token =
				keep?.signerId === signer.id
					? keep.token
					: await this.rotate(signer.id);
			await this.mailSigned(send, request, signer, token);
		}
	}
}
