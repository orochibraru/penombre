import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { driveQuery } from "#lib/server/openapi/v1/storage.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * Signature request route definitions: the requester's side. Signers answer
 * through `/sign/<token>`, a page with form actions, not this API.
 */

const signerSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	position: z.number(),
	status: z.enum(["pending", "signed", "declined"]),
	hasAccount: z.boolean(),
	viewedAt: z.iso.datetime().nullable(),
	respondedAt: z.iso.datetime().nullable(),
	declineReason: z.string().nullable(),
});

export const signatureRequestSchema = z.object({
	id: z.string(),
	fileId: z.string().nullable(),
	documentName: z.string(),
	message: z.string().nullable(),
	sequential: z.boolean(),
	status: z.enum(["pending", "completed", "declined", "cancelled", "expired"]),
	/** SHA-256 of the PDF frozen when the request was sent. */
	documentHash: z.string(),
	pageCount: z.number(),
	/** Everyone signed: `GET …/pdf?kind=signed` answers. */
	signedAvailable: z.boolean(),
	createdAt: z.iso.datetime(),
	expiresAt: z.iso.datetime(),
	completedAt: z.iso.datetime().nullable(),
	signers: z.array(signerSchema),
});

const issuedLinkSchema = z.object({
	signerId: z.string(),
	name: z.string(),
	email: z.string(),
	/** The only time this link is shown: it is stored hashed. */
	url: z.string(),
	emailed: z.boolean(),
});

const idParams = z.object({ id: z.string() });

export const createSignatureRequest = defineRoute({
	method: "post",
	path: "/api/v1/signatures",
	summary: "Ask people to sign a document",
	description:
		"Freezes the document as a PDF (a `.pdf` as it is, a document exported) " +
		"and issues one link per signer, emailed when SMTP is set up. Each " +
		"signer is an account (`userId`) or a name and an address. With " +
		"`sequential`, signers sign in the given order and each is emailed on " +
		"their turn. Needs write access to the document.",
	tags: ["Signatures"],
	query: z.object(driveQuery),
	body: z.object({
		fileId: z.string().min(1),
		signers: z
			.array(
				z.union([
					z.object({ userId: z.string().min(1) }),
					z.object({
						name: z.string().trim().min(1).max(200),
						email: z.email().max(320),
					}),
				]),
			)
			.min(1)
			.max(20),
		message: z.string().max(2000).optional(),
		sequential: z.boolean().default(false),
		expiresInDays: z.number().int().min(1).max(365).default(30),
	}),
	response: z.object({
		request: signatureRequestSchema,
		links: z.array(issuedLinkSchema),
	}),
	errors: [400, 403, 404, 422, 500],
	service: storageServiceFor,
});

export const listSignatureRequests = defineRoute({
	method: "get",
	path: "/api/v1/signatures",
	summary: "List your signature requests",
	description: "Newest first; `fileId` narrows to one document's requests.",
	tags: ["Signatures"],
	query: z.object({ fileId: z.string().optional() }),
	response: z.array(signatureRequestSchema),
	errors: [500],
});

export const cancelSignatureRequest = defineRoute({
	method: "post",
	path: "/api/v1/signatures/{id}/cancel",
	summary: "Cancel a pending signature request",
	description: "Every link stops working; what was signed stays on record.",
	tags: ["Signatures"],
	params: idParams,
	response: signatureRequestSchema,
	errors: [404, 409, 500],
});

export const renewSignatureLink = defineRoute({
	method: "post",
	path: "/api/v1/signatures/{id}/signers/{signerId}/link",
	summary: "Issue a new link for a signer",
	description:
		"Replaces the signer's link (the old one stops working) and returns " +
		"it; with `send` it is also emailed when SMTP is set up. On a " +
		"completed request the link downloads the signed PDF.",
	tags: ["Signatures"],
	params: z.object({ id: z.string(), signerId: z.string() }),
	body: z.object({ send: z.boolean().default(false) }),
	response: issuedLinkSchema,
	errors: [404, 409, 410, 500],
});

export const signatureRequestPdf = defineRoute({
	method: "get",
	path: "/api/v1/signatures/{id}/pdf",
	summary: "Download a signature request's PDF",
	description:
		"`original` is the PDF the signers were shown; `signed` is it with " +
		"every page stamped and the signature certificate appended.",
	tags: ["Signatures"],
	params: idParams,
	query: z.object({ kind: z.enum(["original", "signed"]).default("signed") }),
	response: z.any().describe("The PDF"),
	errors: [404, 500],
});
