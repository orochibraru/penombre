import { fail } from "@sveltejs/kit";
import { auth } from "#lib/server/auth/index.js";
import {
	type SessionUser,
	updateProfile,
} from "#lib/server/services/account.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";

export const load = async () => ({
	// Changing or verifying the address sends codes: offered only with mail.
	smtpAvailable: !!(await getSmtpSettings()),
});

export const actions = {
	updateAccount: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");

		if (!name) {
			return fail(400, { error: "MISSING_FIELDS" });
		}
		const authRes = await auth.api.getSession({ headers: request.headers });
		if (!authRes?.user) {
			return fail(401, { error: "UNAUTHORIZED" });
		}

		const refused = await updateProfile(
			authRes.user as SessionUser,
			request.headers,
			{ name: String(name) },
		);
		if (refused) {
			return fail(500, { error: refused.error });
		}
		return { success: true };
	},
};
