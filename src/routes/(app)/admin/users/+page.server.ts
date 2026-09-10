import { error, fail } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";

export const load = async ({ request }) => {
	try {
		const users = await auth.api.listUsers({
			query: {},
			headers: request.headers,
		});
		return { users };
	} catch {
		return error(500, "Failed to load users");
	}
};

/** Read a required string field, or null when it is missing/blank. */
function field(form: FormData, name: string): string | null {
	const value = form.get(name);
	return typeof value === "string" && value.trim() ? value : null;
}

export const actions = {
	setRole: async ({ request }) => {
		const form = await request.formData();
		const userId = field(form, "userId");
		const role = field(form, "role");
		if (!userId || (role !== "admin" && role !== "user")) {
			return fail(400, { error: "A user and a valid role are required." });
		}
		try {
			await auth.api.setRole({
				headers: request.headers,
				body: { userId, role },
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	setBanned: async ({ request }) => {
		const form = await request.formData();
		const userId = field(form, "userId");
		if (!userId) {
			return fail(400, { error: "A user is required." });
		}
		// The button posts the state it wants, not a toggle — two admins acting
		// at once then converge instead of flipping each other's change.
		const banned = form.get("banned") === "true";
		try {
			if (banned) {
				await auth.api.banUser({
					headers: request.headers,
					body: { userId, banReason: field(form, "reason") ?? undefined },
				});
			} else {
				await auth.api.unbanUser({
					headers: request.headers,
					body: { userId },
				});
			}
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},

	removeUser: async ({ request, locals }) => {
		const form = await request.formData();
		const userId = field(form, "userId");
		if (!userId) {
			return fail(400, { error: "A user is required." });
		}
		// Deleting yourself locks the instance out of its own admin panel.
		if (userId === locals.user?.id) {
			return fail(400, { error: "You cannot delete your own account." });
		}
		try {
			await auth.api.removeUser({
				headers: request.headers,
				body: { userId },
			});
			return { success: true };
		} catch (err) {
			return fail(500, { error: (err as Error).message });
		}
	},
};
