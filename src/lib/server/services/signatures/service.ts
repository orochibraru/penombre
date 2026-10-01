/**
 * Signature requests, from the requester's side: asking, listing, cancelling
 * and reissuing links. See `base.ts` for how links are kept.
 */

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
	type SignatureRequest,
	signatureRequests,
	signatureSigners,
	user,
} from "#lib/server/db/schema.js";
import {
	type CreateInput,
	DAY_MS,
	DEFAULT_LINK_DAYS,
	effectiveStatus,
	hashToken,
	type IssuedLink,
	MAX_SIGNERS,
	newToken,
	originalKey,
	type RequestDto,
	refusal,
	SignatureError,
	type SignerInput,
	toDto,
	who,
} from "./base";
import { freezeDocument } from "./pdf";
import { SignatureSigning } from "./signing";

export * from "./base";
export { UnsignableDocumentError } from "./pdf";

/** The slice of a `StorageService` a request reads its document through. */
export interface DocumentSource {
	readonly readOnly: boolean;
	findFileById: (id: string) => Promise<string | null>;
	getRawFileData: (key: string) => Promise<{
		buffer: ArrayBuffer;
		meta: { metadata: { name?: string | null; isTrashed?: boolean | null } };
	} | null>;
}

export class SignatureService extends SignatureSigning {
	/**
	 * Asks for signatures on a document as the caller's storage sees it: a
	 * reader (read-only share, drive viewer, read-only volume) may not.
	 */
	async request(
		storage: DocumentSource,
		fileId: string,
		input: Omit<CreateInput, "file" | "bytes">,
	): Promise<{ request: RequestDto; links: IssuedLink[] }> {
		if (storage.readOnly) {
			throw new SignatureError(
				403,
				"Only someone who can edit this document can ask for signatures.",
			);
		}
		const path = await storage.findFileById(fileId);
		const raw = path ? await storage.getRawFileData(path) : null;
		if (!(path && raw) || raw.meta.metadata.isTrashed) {
			throw new SignatureError(404, "Document not found.");
		}
		return await this.create({
			...input,
			file: { id: fileId, name: raw.meta.metadata.name ?? path },
			bytes: raw.buffer,
		});
	}

	/** Accounts are named from their row, never from what the client sent. */
	private async resolvePeople(inputs: SignerInput[]) {
		if (inputs.length === 0 || inputs.length > MAX_SIGNERS) {
			throw new SignatureError(
				400,
				`Ask between 1 and ${MAX_SIGNERS} people to sign.`,
			);
		}
		const ids = inputs.flatMap((input) => (input.userId ? [input.userId] : []));
		const accounts =
			ids.length > 0
				? await this.db
						.select({ id: user.id, name: user.name, email: user.email })
						.from(user)
						.where(inArray(user.id, ids))
				: [];
		const byId = new Map(accounts.map((account) => [account.id, account]));
		const people = inputs.map((input) => {
			const account = input.userId ? byId.get(input.userId) : undefined;
			if (input.userId && !account) {
				throw new SignatureError(400, "One of the accounts does not exist.");
			}
			const name = (account?.name ?? input.name ?? "").trim();
			const email = (account?.email ?? input.email ?? "").trim().toLowerCase();
			if (!(name && email.includes("@"))) {
				throw new SignatureError(
					400,
					"Every signer needs a name and an email address.",
				);
			}
			return { userId: account?.id ?? null, name, email };
		});
		if (new Set(people.map((p) => p.email)).size !== people.length) {
			throw new SignatureError(
				400,
				"Each signer needs their own email address.",
			);
		}
		return people;
	}

	async create(
		input: CreateInput,
	): Promise<{ request: RequestDto; links: IssuedLink[] }> {
		const people = await this.resolvePeople(input.signers);
		const frozen = await freezeDocument(input.file.name, input.bytes);
		const id = crypto.randomUUID();
		await this.deps.store.write(originalKey(id), frozen.pdf);

		const now = new Date();
		const days = input.expiresInDays ?? DEFAULT_LINK_DAYS;
		const [request] = await this.db
			.insert(signatureRequests)
			.values({
				id,
				ownerId: input.requester.id,
				fileId: input.file.id,
				documentName: input.file.name,
				message: input.message?.trim() || null,
				sequential: input.sequential,
				documentHash: frozen.hash,
				pageCount: frozen.pageCount,
				expiresAt: new Date(now.getTime() + days * DAY_MS),
				createdAt: now,
			})
			.returning();
		if (!request) {
			throw new Error("The signature request was not stored");
		}
		const tokens = people.map(() => newToken());
		const signers = await this.db
			.insert(signatureSigners)
			.values(
				people.map((person, position) => ({
					id: crypto.randomUUID(),
					requestId: id,
					position,
					...person,
					tokenHash: hashToken(tokens[position] ?? ""),
				})),
			)
			.returning();
		signers.sort((a, b) => a.position - b.position);
		await this.log(id, [
			{
				type: "created",
				actor: who(input.requester),
				detail: `SHA-256 ${frozen.hash}`,
			},
		]);

		const send = await this.deps.mailer();
		const links: IssuedLink[] = [];
		for (const signer of signers) {
			const token = tokens[signer.position] ?? "";
			const turn = !request.sequential || signer.position === 0;
			const emailed =
				!!send && turn && (await this.invite(send, request, signer, token));
			await this.log(id, [
				{
					type: "sent",
					signerId: signer.id,
					actor: who(signer),
					detail: emailed ? "by email" : "link given to the requester",
				},
			]);
			links.push({
				signerId: signer.id,
				name: signer.name,
				email: signer.email,
				url: this.link(token),
				emailed,
			});
		}
		return { request: toDto(request, signers), links };
	}

	async list(ownerId: string, fileId?: string): Promise<RequestDto[]> {
		const requests = await this.db
			.select()
			.from(signatureRequests)
			.where(
				and(
					eq(signatureRequests.ownerId, ownerId),
					...(fileId ? [eq(signatureRequests.fileId, fileId)] : []),
				),
			)
			.orderBy(desc(signatureRequests.createdAt))
			.limit(200);
		if (requests.length === 0) {
			return [];
		}
		const signers = await this.db
			.select()
			.from(signatureSigners)
			.where(
				inArray(
					signatureSigners.requestId,
					requests.map((request) => request.id),
				),
			)
			.orderBy(asc(signatureSigners.position));
		return requests.map((request) =>
			toDto(
				request,
				signers.filter((signer) => signer.requestId === request.id),
			),
		);
	}

	private async owned(id: string, ownerId: string): Promise<SignatureRequest> {
		const [request] = await this.db
			.select()
			.from(signatureRequests)
			.where(
				and(
					eq(signatureRequests.id, id),
					eq(signatureRequests.ownerId, ownerId),
				),
			)
			.limit(1);
		if (!request) {
			throw new SignatureError(404, "No such signature request.");
		}
		return request;
	}

	async cancel(
		id: string,
		owner: { id: string; name: string; email: string },
	): Promise<RequestDto> {
		const request = await this.owned(id, owner.id);
		const [cancelled] = await this.db
			.update(signatureRequests)
			.set({ status: "cancelled" })
			.where(
				and(
					eq(signatureRequests.id, id),
					eq(signatureRequests.status, "pending"),
				),
			)
			.returning();
		if (!cancelled) {
			throw new SignatureError(409, "Only a pending request can be cancelled.");
		}
		await this.log(id, [{ type: "cancelled", actor: who(owner) }]);
		return toDto(cancelled ?? request, await this.signersOf(id));
	}

	/**
	 * A fresh link for one signer, emailed when asked and possible. On a
	 * finished request it is the signed PDF's download link.
	 */
	async renewLink(
		id: string,
		signerId: string,
		ownerId: string,
		send: boolean,
	): Promise<IssuedLink> {
		const request = await this.owned(id, ownerId);
		const status = effectiveStatus(request);
		if (status !== "pending" && status !== "completed") {
			throw refusal(status) ?? new SignatureError(409, "Closed");
		}
		const signer = (await this.signersOf(id)).find((s) => s.id === signerId);
		if (!signer) {
			throw new SignatureError(404, "No such signer.");
		}
		const token = await this.rotate(signer.id);
		const sender = send ? await this.deps.mailer() : null;
		let emailed = false;
		if (sender && status === "completed") {
			emailed = await this.mailSigned(sender, request, signer, token);
		} else if (sender) {
			emailed = await this.invite(sender, request, signer, token);
		}
		if (status === "pending") {
			await this.log(id, [
				{
					type: "sent",
					signerId,
					actor: who(signer),
					detail: emailed
						? "new link, by email"
						: "new link given to the requester",
				},
			]);
		}
		return {
			signerId,
			name: signer.name,
			email: signer.email,
			url: this.link(token),
			emailed,
		};
	}

	/** A request's PDF for its requester; the signed one is built if missing. */
	async ownerPdf(
		id: string,
		ownerId: string,
		kind: "original" | "signed",
	): Promise<{ bytes: Uint8Array; name: string } | null> {
		let request = await this.owned(id, ownerId);
		if (kind === "signed" && !request.signedHash) {
			await this.finalize(id);
			request = await this.owned(id, ownerId);
		}
		return await this.pdfOf(request, kind);
	}
}
