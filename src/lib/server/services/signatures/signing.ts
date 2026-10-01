import { and, desc, eq, isNull } from "drizzle-orm";
import { signatureRequests, signatureSigners } from "#lib/server/db/schema.js";
import {
	DAY_MS,
	DOWNLOAD_DAYS,
	effectiveStatus,
	type Found,
	hashToken,
	type RequestMeta,
	refusal,
	SignatureError,
	type SigningView,
	validTimeZone,
	who,
} from "./base";
import { SignatureCompletion } from "./completion";
import { assertSignatureImage, UnsignableDocumentError } from "./pdf";

/** What a signer does through their link; nobody here is signed in as the owner. */
export class SignatureSigning extends SignatureCompletion {
	/** What `/sign/<token>` shows; null for a link that is not one. */
	async open(token: string, meta: RequestMeta): Promise<SigningView | null> {
		const found = await this.byToken(token);
		if (!found) {
			return null;
		}
		const { signer, request } = found;
		await this.throttle(`sign:view:${signer.id}`, 120);
		if (!signer.viewedAt && effectiveStatus(request) === "pending") {
			const [first] = await this.db
				.update(signatureSigners)
				.set({ viewedAt: new Date() })
				.where(
					and(
						eq(signatureSigners.id, signer.id),
						isNull(signatureSigners.viewedAt),
					),
				)
				.returning({ id: signatureSigners.id });
			if (first) {
				await this.log(request.id, [
					{ type: "viewed", signerId: signer.id, actor: who(signer), meta },
				]);
			}
		}
		return await this.view(found);
	}

	private async view({ signer, request }: Found): Promise<SigningView> {
		const all = await this.signersOf(request.id);
		const status = effectiveStatus(request);
		const blocking = request.sequential
			? all.find(
					(other) =>
						other.position < signer.position && other.status !== "signed",
				)
			: undefined;
		return {
			requestId: request.id,
			documentName: request.documentName,
			message: request.message,
			requesterName: (await this.person(request.ownerId)).name,
			status,
			pageCount: request.pageCount,
			documentHash: request.documentHash,
			expiresAt: request.expiresAt.toISOString(),
			signer: { name: signer.name, email: signer.email, status: signer.status },
			waitingFor: blocking?.name ?? null,
			signers: all.map((other) => ({
				name: other.name,
				status: other.status,
				you: other.id === signer.id,
			})),
			downloadUntil:
				status === "completed" && request.signedHash && request.completedAt
					? new Date(
							request.completedAt.getTime() + DOWNLOAD_DAYS * DAY_MS,
						).toISOString()
					: null,
		};
	}

	/** The same checks for signing and declining; returns what they act on. */
	private async answerable(token: string): Promise<Found> {
		const found = await this.byToken(token);
		if (!found) {
			throw new SignatureError(
				404,
				"This link does not exist or was replaced by a newer one.",
			);
		}
		await this.throttle(`sign:act:${found.signer.id}`, 10);
		const closed = refusal(effectiveStatus(found.request));
		if (closed) {
			throw closed;
		}
		if (found.signer.status !== "pending") {
			throw new SignatureError(409, "You have already answered this request.");
		}
		return found;
	}

	async sign(
		token: string,
		input: { signature: string; timeZone?: string | null; consent: boolean },
		meta: RequestMeta,
	): Promise<SigningView> {
		const found = await this.answerable(token);
		const { signer, request } = found;
		if (!input.consent) {
			throw new SignatureError(400, "Agree to sign electronically first.");
		}
		const blocking = request.sequential
			? (await this.signersOf(request.id)).find(
					(other) =>
						other.position < signer.position && other.status !== "signed",
				)
			: undefined;
		if (blocking) {
			throw new SignatureError(409, `${blocking.name} has to sign first.`);
		}
		try {
			await assertSignatureImage(input.signature);
		} catch (error) {
			if (error instanceof UnsignableDocumentError) {
				throw new SignatureError(400, error.message);
			}
			throw error;
		}
		// Only an account at the signer's own address is recorded as them.
		const account =
			meta.account && meta.account.email.toLowerCase() === signer.email
				? meta.account.id
				: null;
		const now = new Date();
		const [signed] = await this.db
			.update(signatureSigners)
			.set({
				status: "signed",
				signature: input.signature,
				ipAddress: meta.ipAddress,
				userAgent: meta.userAgent?.slice(0, 400) ?? null,
				timeZone: validTimeZone(input.timeZone),
				respondedAt: now,
				viewedAt: signer.viewedAt ?? now,
				userId: signer.userId ?? account,
			})
			.where(
				and(
					eq(signatureSigners.id, signer.id),
					eq(signatureSigners.status, "pending"),
					eq(signatureSigners.tokenHash, hashToken(token)),
				),
			)
			.returning();
		if (!signed) {
			throw new SignatureError(409, "You have already answered this request.");
		}
		await this.log(request.id, [
			{
				type: "signed",
				signerId: signer.id,
				actor: who(signer),
				detail: meta.account ? `signed in as ${meta.account.email}` : null,
				meta,
			},
		]);
		if (request.sequential) {
			await this.advance(request);
		}
		await this.finalize(request.id, { signerId: signer.id, token });
		return await this.view({
			signer: signed,
			request: (await this.byToken(token))?.request ?? request,
		});
	}

	async decline(
		token: string,
		reason: string | null,
		meta: RequestMeta,
	): Promise<SigningView> {
		const { signer, request } = await this.answerable(token);
		const why = reason?.trim().slice(0, 500) || null;
		const [declined] = await this.db
			.update(signatureSigners)
			.set({
				status: "declined",
				declineReason: why,
				ipAddress: meta.ipAddress,
				userAgent: meta.userAgent?.slice(0, 400) ?? null,
				respondedAt: new Date(),
			})
			.where(
				and(
					eq(signatureSigners.id, signer.id),
					eq(signatureSigners.status, "pending"),
				),
			)
			.returning();
		if (!declined) {
			throw new SignatureError(409, "You have already answered this request.");
		}
		const [closed] = await this.db
			.update(signatureRequests)
			.set({ status: "declined" })
			.where(
				and(
					eq(signatureRequests.id, request.id),
					eq(signatureRequests.status, "pending"),
				),
			)
			.returning();
		await this.log(request.id, [
			{
				type: "declined",
				signerId: signer.id,
				actor: who(signer),
				detail: why,
				meta,
			},
		]);
		// Nobody is told about their own action.
		if (signer.userId !== request.ownerId) {
			await this.deps.notify({
				userId: request.ownerId,
				type: "signature_declined",
				actorName: signer.name,
				resourceName: request.documentName,
				link: "/signatures",
			});
		}
		return await this.view({ signer: declined, request: closed ?? request });
	}

	/**
	 * A PDF through a signer's link: the document while the request is open or
	 * done, the signed one for `DOWNLOAD_DAYS` after completion.
	 */
	async signerPdf(
		token: string,
		kind: "original" | "signed",
	): Promise<{ bytes: Uint8Array; name: string } | null> {
		const found = await this.byToken(token);
		if (!found) {
			return null;
		}
		await this.throttle(`sign:pdf:${found.signer.id}`, 60);
		const { request } = found;
		const status = effectiveStatus(request);
		if (kind === "original" && status !== "pending" && status !== "completed") {
			return null;
		}
		const window = request.completedAt
			? request.completedAt.getTime() + DOWNLOAD_DAYS * DAY_MS
			: 0;
		if (kind === "signed" && (status !== "completed" || Date.now() > window)) {
			return null;
		}
		return await this.pdfOf(request, kind);
	}

	/** The account's latest signature, offered again on their next request. */
	async lastSignature(userId: string): Promise<string | null> {
		const [row] = await this.db
			.select({ signature: signatureSigners.signature })
			.from(signatureSigners)
			.where(
				and(
					eq(signatureSigners.userId, userId),
					eq(signatureSigners.status, "signed"),
				),
			)
			.orderBy(desc(signatureSigners.respondedAt))
			.limit(1);
		return row?.signature ?? null;
	}
}
