import { auth } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const fallback: RequestHandler = async ({ request }) => {
	return auth.handler(request);
};
