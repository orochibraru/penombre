import { error } from "@sveltejs/kit";
import type { AuthType } from "#lib/server/auth/index.js";

/**
 * Refuse a form action to anyone but a signed-in admin.
 *
 * `admin/+layout.server.ts`'s `load` only gates navigation; a POST straight
 * to a form action never runs it, so every admin action must check for
 * itself.
 */
export function requireAdmin(locals: {
	user: AuthType["user"] | null | undefined;
}): void {
	if (locals.user?.role !== "admin") {
		error(403, "Admins only.");
	}
}
