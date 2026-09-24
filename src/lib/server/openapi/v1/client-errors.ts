import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";

export const reportClientError = defineRoute({
	method: "post",
	path: "/api/v1/client-errors",
	summary: "Report a browser error",
	description:
		"Logs an unexpected error thrown in the browser under the id the error page shows. Does not require authentication, so a crash on the sign-in page is reported too.",
	tags: ["Diagnostics"],
	requireAuth: false,
	body: z.object({
		errorId: z.string().max(64),
		message: z.string().max(2000),
		stack: z.string().max(8000).optional(),
		url: z.string().max(2000),
	}),
	response: z.object({}),
	errors: [400, 429],
});
