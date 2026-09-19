import { auth } from "#lib/server/auth/index.js";

export const fallback = ({ request }) => auth.handler(request);
