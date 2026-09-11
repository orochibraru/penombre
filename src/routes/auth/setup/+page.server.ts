import { fail, redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { createFirstAdmin, needsSetup } from "$lib/server/auth/seed";
import { getConfig } from "$lib/server/config";

export const load = async () => {
	// Reachable exactly once. Afterwards it is just the sign-in page, so a
	// stale bookmark cannot be used to add a second "first" administrator.
	if (!(await needsSetup())) {
		redirect(302, resolve("/auth/sign-in"));
	}
	return { minPasswordLength: getConfig().auth.minPasswordLength };
};

export const actions = {
	create: async ({ request }) => {
		if (!(await needsSetup())) {
			return fail(409, { error: "This instance already has an account." });
		}

		const form = await request.formData();
		const email = String(form.get("email") ?? "")
			.trim()
			.toLowerCase();
		const password = String(form.get("password") ?? "");
		const confirm = String(form.get("passwordConfirm") ?? "");
		const name = String(form.get("name") ?? "").trim();

		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return fail(400, { error: "Enter a valid email address." });
		}

		const min = getConfig().auth.minPasswordLength;
		if (password.length < min) {
			return fail(400, {
				error: `Password must be at least ${min} characters.`,
			});
		}
		if (password !== confirm) {
			return fail(400, { error: "The passwords do not match." });
		}

		const result = await createFirstAdmin({ email, password, name });
		if (!result.ok) {
			return fail(400, { error: result.error });
		}

		redirect(303, resolve("/auth/sign-in"));
	},
};
