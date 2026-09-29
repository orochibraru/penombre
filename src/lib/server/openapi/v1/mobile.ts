import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";

export const mobileToken = defineRoute({
	method: "post",
	path: "/api/v1/mobile/token",
	summary: "Exchange a mobile sign-in code",
	description:
		"Redeems the single-use code from /auth/mobile/authorize with its PKCE verifier and returns a new session: its token for `Authorization: Bearer`, and its signed cookie for the app's embedded browser.",
	tags: ["Auth"],
	requireAuth: false,
	body: z.object({
		code: z.string().max(128),
		code_verifier: z.string().min(43).max(128),
	}),
	response: z.object({
		token: z.string(),
		expiresAt: z.string(),
		cookie: z.object({ name: z.string(), value: z.string() }),
		user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
	}),
	errors: [400, 401, 429],
});
