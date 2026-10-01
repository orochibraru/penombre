import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";

export const mobileToken = defineRoute({
	method: "post",
	path: "/api/v1/mobile/token",
	summary: "Exchange a mobile sign-in code",
	description:
		"Redeems a single-use code and returns a new session: its token for `Authorization: Bearer`, and its signed cookie for the app's embedded browser. A code from /auth/mobile/authorize comes with its PKCE `code_verifier`; one read from a pairing QR code comes with the `device` name instead.",
	tags: ["Auth"],
	requireAuth: false,
	body: z.object({
		code: z.string().max(128),
		code_verifier: z.string().min(43).max(128).optional(),
		device: z.string().max(100).optional(),
	}),
	response: z.object({
		token: z.string(),
		expiresAt: z.string(),
		cookie: z.object({ name: z.string(), value: z.string() }),
		user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
	}),
	errors: [400, 401, 429],
});

export const mobilePair = defineRoute({
	method: "post",
	path: "/api/v1/mobile/pair",
	summary: "Create a mobile pairing code",
	description:
		"For a signed-in browser: a single-use link, valid two minutes, to show as a QR code. The app that scans it is signed in to this account. Refused for an API key.",
	tags: ["Auth"],
	response: z.object({ url: z.string(), expiresAt: z.string() }),
	errors: [401, 403, 429],
});

export const mobileSession = defineRoute({
	method: "put",
	path: "/api/v1/mobile/session",
	summary: "Name the app's session",
	description:
		"For the app, once it signed itself in with an emailed code: labels the calling session `Penombre mobile · <device>`, as a pairing or browser sign-in would have. Refused for an API key.",
	tags: ["Auth"],
	body: z.object({ device: z.string().min(1).max(100) }),
	response: z.object({ userAgent: z.string() }),
	errors: [400, 401, 403],
});
