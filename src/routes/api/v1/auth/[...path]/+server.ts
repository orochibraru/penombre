import { auth } from "#lib/server/auth/index.js";

export const fallback = async ({ request }) => auth.handler(request);
