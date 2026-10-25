import { z } from "zod";

import { defineRoute } from "#lib/server/openapi/index.js";

/**
 * A signer's side of a signature request, for an app: what `/sign/<token>`
 * shows and does, through the same service. The signer is named by the
 * link's token, in the body so it stays out of the request log, or by
 * `signer`, their row's id, which opens only for that account signed in (what
 * a notification carries). Anything else is a 404.
 */

const key = {
	token: z.string().min(1).max(128).optional(),
	signer: z.string().min(1).max(64).optional(),
};
const oneKey = (body: { token?: string; signer?: string }) =>
	!body.token !== !body.signer;
const keyMessage = "Send either `token` or `signer`";

const statusSchema = z.enum(["pending", "signed", "declined"]);

const signingViewSchema = z.object({
	requestId: z.string(),
	documentName: z.string(),
	message: z.string().nullable(),
	requesterName: z.string(),
	status: z.enum(["pending", "completed", "declined", "cancelled", "expired"]),
	pageCount: z.number(),
	documentHash: z.string(),
	expiresAt: z.string(),
	signer: z.object({
		name: z.string(),
		email: z.string(),
		status: statusSchema,
	}),
	waitingFor: z.string().nullable(),
	signers: z.array(
		z.object({ name: z.string(), status: statusSchema, you: z.boolean() }),
	),
	downloadUntil: z.string().nullable(),
});

export const openSigning = defineRoute({
	method: "post",
	path: "/api/v1/signing/view",
	summary: "Open a signing link",
	description:
		"What the link's page shows: the document, who asked, who signs. " +
		"Records the first view in the audit trail.",
	tags: ["Signatures"],
	requireAuth: false,
	body: z.object(key).refine(oneKey, keyMessage),
	response: signingViewSchema,
	errors: [404, 410, 429, 500],
});

export const signingDocument = defineRoute({
	method: "post",
	path: "/api/v1/signing/document",
	summary: "The PDF a signing link asks to sign",
	description: "`signed` is the signed PDF, once everyone has signed.",
	tags: ["Signatures"],
	requireAuth: false,
	body: z
		.object({
			...key,
			kind: z.enum(["original", "signed"]).default("original"),
		})
		.refine(oneKey, keyMessage),
	response: z.any().describe("The PDF"),
	errors: [404, 429, 500],
});

export const signThroughLink = defineRoute({
	method: "post",
	path: "/api/v1/signing/sign",
	summary: "Sign through a signing link",
	description:
		"`signature` is a small PNG data URL. A link signs once; signed in " +
		"with the account at the signer's address, the signature is recorded " +
		"as that account's.",
	tags: ["Signatures"],
	requireAuth: false,
	body: z
		.object({
			...key,
			signature: z.string().max(300_000),
			timeZone: z.string().max(64).optional(),
			consent: z.literal(true),
		})
		.refine(oneKey, keyMessage),
	response: signingViewSchema,
	errors: [400, 404, 409, 410, 429, 500],
});

export const declineThroughLink = defineRoute({
	method: "post",
	path: "/api/v1/signing/decline",
	summary: "Decline through a signing link",
	description: "Closes the whole request and tells whoever asked.",
	tags: ["Signatures"],
	requireAuth: false,
	body: z
		.object({ ...key, reason: z.string().max(500).optional() })
		.refine(oneKey, keyMessage),
	response: signingViewSchema,
	errors: [404, 409, 410, 429, 500],
});
