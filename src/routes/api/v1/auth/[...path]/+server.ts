import { auth } from "$lib/server/auth";

export const fallback = async ({ request }) => auth.handler(request);
