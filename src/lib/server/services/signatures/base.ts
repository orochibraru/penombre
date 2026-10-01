/**
 * Shared by every part of the signature service: its types, the helpers that
 * read requests and signers, and how a link is issued and mailed.
 *
 * Signature requests: the owner freezes a document as a PDF and asks people
 * to sign it through personal links; once all have, the frozen PDF plus a
 * certificate becomes the signed PDF.
 *
 * A link is a random token stored only as its SHA-256, so the raw link exists
 * in exactly two places: the response that issued it and the email carrying
 * it. Showing a link again therefore always means issuing a new one.
 */

import { createHash, randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import type { Database } from "#lib/server/db/index.js";
import {
	type SignatureRequest,
	type SignatureSigner,
	signatureEvents,
	signatureRequests,
	signatureSigners,
	user,
} from "#lib/server/db/schema.js";
import type { EmailContent } from "#lib/server/email-template.js";
import { isRateLimited } from "#lib/server/rate-limit.js";
import type { NotificationInput } from "#lib/server/services/notifications.js";
import { requestEmail, signedEmail } from "./mail";

export const DEFAULT_LINK_DAYS = 30;
/** How long a signer's link keeps downloading the signed PDF. */
export const DOWNLOAD_DAYS = 90;
export const MAX_SIGNERS = 20;
export const DAY_MS = 86_400_000;

export type RequestStatus =
	| "pending"
	| "completed"
	| "declined"
	| "cancelled"
	| "expired";
export type EventType = (typeof signatureEvents.$inferInsert)["type"];

/** A refusal with the HTTP status that says why. */
export class SignatureError extends Error {
	constructor(
		readonly status: 400 | 403 | 404 | 409 | 410 | 429,
		message: string,
	) {
		super(message);
	}
}

/** Where frozen and signed PDFs live, outside every user's tree. */
export interface PdfStore {
	write: (key: string, bytes: Uint8Array) => Promise<void>;
	read: (key: string) => Promise<Uint8Array | null>;
}

export type Send = (to: string, content: EmailContent) => Promise<void>;

export interface SignatureDeps {
	database: Database;
	store: PdfStore;
	/** A sender, or null when the instance has no mail. */
	mailer: () => Promise<Send | null>;
	notify: (input: NotificationInput) => Promise<void>;
	/** Files the signed PDF next to the document. */
	saveSigned: (request: SignatureRequest, bytes: Uint8Array) => Promise<void>;
	origin: () => string;
	warn: (message: string, error?: unknown) => void;
}

export interface SignerInput {
	userId?: string;
	name?: string;
	email?: string;
}

export interface CreateInput {
	requester: { id: string; name: string; email: string };
	file: { id: string; name: string };
	bytes: ArrayBuffer;
	signers: SignerInput[];
	message?: string | null;
	sequential: boolean;
	expiresInDays?: number;
}

export interface IssuedLink {
	signerId: string;
	name: string;
	email: string;
	url: string;
	emailed: boolean;
}

export interface SignerDto {
	id: string;
	name: string;
	email: string;
	position: number;
	status: SignatureSigner["status"];
	hasAccount: boolean;
	viewedAt: string | null;
	respondedAt: string | null;
	declineReason: string | null;
}

export interface RequestDto {
	id: string;
	fileId: string | null;
	documentName: string;
	message: string | null;
	sequential: boolean;
	status: RequestStatus;
	documentHash: string;
	pageCount: number;
	/** Everyone signed: the signed PDF can be downloaded. */
	signedAvailable: boolean;
	createdAt: string;
	expiresAt: string;
	completedAt: string | null;
	signers: SignerDto[];
}

export interface SigningView {
	requestId: string;
	documentName: string;
	message: string | null;
	requesterName: string;
	status: RequestStatus;
	pageCount: number;
	documentHash: string;
	expiresAt: string;
	signer: { name: string; email: string; status: SignatureSigner["status"] };
	/** Someone earlier in the order who has not signed yet. */
	waitingFor: string | null;
	signers: { name: string; status: SignatureSigner["status"]; you: boolean }[];
	/** Until when the signed PDF downloads from this link. */
	downloadUntil: string | null;
}

export interface RequestMeta {
	ipAddress: string | null;
	userAgent: string | null;
	/** The signed-in account opening the link, if any. */
	account?: { id: string; email: string } | null;
}

export interface Found {
	signer: SignatureSigner;
	request: SignatureRequest;
}

export const hashToken = (token: string): string =>
	createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const originalKey = (id: string) => `${id}/original.pdf`;
export const signedKey = (id: string, hash: string) =>
	`${id}/signed-${hash}.pdf`;
const iso = (date: Date | null) => date?.toISOString() ?? null;
export const who = (person: { name: string; email: string }) =>
	`${person.name} <${person.email}>`;

export function effectiveStatus(
	request: Pick<SignatureRequest, "status" | "expiresAt">,
	now = new Date(),
): RequestStatus {
	return request.status === "pending" && request.expiresAt <= now
		? "expired"
		: request.status;
}

/** A zone `Intl` knows, or null: it is printed on the certificate. */
export function validTimeZone(zone: string | null | undefined): string | null {
	if (!zone || zone.length > 64) {
		return null;
	}
	try {
		return new Intl.DateTimeFormat("en", { timeZone: zone }).resolvedOptions()
			.timeZone;
	} catch {
		return null;
	}
}

export function toDto(
	request: SignatureRequest,
	signers: SignatureSigner[],
): RequestDto {
	return {
		id: request.id,
		fileId: request.fileId,
		documentName: request.documentName,
		message: request.message,
		sequential: request.sequential,
		status: effectiveStatus(request),
		documentHash: request.documentHash,
		pageCount: request.pageCount,
		signedAvailable:
			request.status !== "declined" &&
			request.status !== "cancelled" &&
			signers.every((signer) => signer.status === "signed"),
		createdAt: request.createdAt.toISOString(),
		expiresAt: request.expiresAt.toISOString(),
		completedAt: iso(request.completedAt),
		signers: signers.map((signer) => ({
			id: signer.id,
			name: signer.name,
			email: signer.email,
			position: signer.position,
			status: signer.status,
			hasAccount: signer.userId !== null,
			viewedAt: iso(signer.viewedAt),
			respondedAt: iso(signer.respondedAt),
			declineReason: signer.declineReason,
		})),
	};
}

/** Why a request no longer takes answers, for anything but `pending`. */
export function refusal(status: RequestStatus): SignatureError | null {
	switch (status) {
		case "expired":
			return new SignatureError(410, "This signature request has expired.");
		case "cancelled":
			return new SignatureError(410, "This signature request was cancelled.");
		case "declined":
			return new SignatureError(
				409,
				"Someone declined to sign; the request is closed.",
			);
		case "completed":
			return new SignatureError(409, "Everyone has already signed.");
		default:
			return null;
	}
}

export class SignatureBase {
	constructor(protected readonly deps: SignatureDeps) {}

	protected get db() {
		return this.deps.database;
	}

	protected link(token: string): string {
		return `${this.deps.origin()}/sign/${token}`;
	}

	protected async log(
		requestId: string,
		events: {
			type: EventType;
			signerId?: string;
			actor?: string | null;
			detail?: string | null;
			meta?: RequestMeta;
		}[],
	): Promise<void> {
		await this.db.insert(signatureEvents).values(
			events.map((event) => ({
				id: uuidv7(),
				requestId,
				signerId: event.signerId ?? null,
				type: event.type,
				actor: event.actor ?? null,
				detail: event.detail ?? null,
				ipAddress: event.meta?.ipAddress ?? null,
				userAgent: event.meta?.userAgent ?? null,
			})),
		);
	}

	protected async throttle(key: string, max: number): Promise<void> {
		if (await isRateLimited(key, { max, windowSeconds: 600 })) {
			throw new SignatureError(
				429,
				"Too many attempts. Try again in a few minutes.",
			);
		}
	}

	protected async signersOf(requestId: string): Promise<SignatureSigner[]> {
		return await this.db
			.select()
			.from(signatureSigners)
			.where(eq(signatureSigners.requestId, requestId))
			.orderBy(asc(signatureSigners.position));
	}

	protected async person(id: string) {
		const [row] = await this.db
			.select({ name: user.name, email: user.email })
			.from(user)
			.where(eq(user.id, id))
			.limit(1);
		return row ?? { name: "", email: "" };
	}

	protected async invite(
		send: Send,
		request: SignatureRequest,
		signer: { name: string; email: string },
		token: string,
	): Promise<boolean> {
		try {
			await send(
				signer.email,
				requestEmail({
					requester: who(await this.person(request.ownerId)),
					documentName: request.documentName,
					message: request.message,
					expiresAt: request.expiresAt,
					url: this.link(token),
				}),
			);
			return true;
		} catch (error) {
			this.deps.warn("Could not email a signing link", error);
			return false;
		}
	}

	protected async mailSigned(
		send: Send,
		request: SignatureRequest,
		signer: { name: string; email: string },
		token: string,
	): Promise<boolean> {
		try {
			await send(
				signer.email,
				signedEmail({
					documentName: request.documentName,
					availableUntil: new Date(
						(request.completedAt ?? new Date()).getTime() +
							DOWNLOAD_DAYS * DAY_MS,
					),
					url: this.link(token),
				}),
			);
			return true;
		} catch (error) {
			this.deps.warn("Could not email a signed PDF link", error);
			return false;
		}
	}

	/** A new token for `signer`: the old link stops working. */
	protected async rotate(signerId: string): Promise<string> {
		const token = newToken();
		await this.db
			.update(signatureSigners)
			.set({ tokenHash: hashToken(token) })
			.where(eq(signatureSigners.id, signerId));
		return token;
	}

	protected async byToken(token: string): Promise<Found | null> {
		if (!token || token.length > 128) {
			return null;
		}
		const [signer] = await this.db
			.select()
			.from(signatureSigners)
			.where(eq(signatureSigners.tokenHash, hashToken(token)))
			.limit(1);
		if (!signer) {
			return null;
		}
		const [request] = await this.db
			.select()
			.from(signatureRequests)
			.where(eq(signatureRequests.id, signer.requestId))
			.limit(1);
		return request ? { signer, request } : null;
	}

	protected async pdfOf(
		request: SignatureRequest,
		kind: "original" | "signed",
	): Promise<{ bytes: Uint8Array; name: string } | null> {
		const base = request.documentName.replace(/\.[^.]+$/, "");
		if (kind === "original") {
			const bytes = await this.deps.store.read(originalKey(request.id));
			return bytes ? { bytes, name: `${base}.pdf` } : null;
		}
		const bytes = request.signedHash
			? await this.deps.store.read(signedKey(request.id, request.signedHash))
			: null;
		return bytes ? { bytes, name: `${base} (signed).pdf` } : null;
	}
}
