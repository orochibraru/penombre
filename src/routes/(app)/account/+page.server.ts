import { fail } from "@sveltejs/kit";
import { Logger } from "#lib/logger.js";
import { auth } from "#lib/server/auth/index.js";
import { getConfig } from "#lib/server/config.js";

const logger = new Logger("account-page.server.ts");

export const actions = {
	updateAccount: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (!(name && email)) {
			return fail(400, { error: "MISSING_FIELDS" });
		}

		const config = getConfig();

		// Here you would typically update the user's account details in your database
		logger.debug("Updating account with name:", name, "and email:", email);

		const authRes = await auth.api.getSession({ headers: request.headers });
		if (!authRes?.user) {
			logger.error("No authenticated user found in session");
			return fail(401, { error: "UNAUTHORIZED" });
		}

		if (email !== authRes.user.email) {
			if (!config.smtp?.enabled) {
				logger.error("Attempted email change without SMTP enabled");
				return fail(400, { error: "EMAIL_CHANGE_REQUIRES_SMTP" });
			}
			try {
				await auth.api.adminUpdateUser({
					body: {
						userId: authRes.user.id,
						data: {
							email: String(email),
							emailVerified: false,
						},
					},
					headers: request.headers,
				});
			} catch (error) {
				logger.error("Error updating email:", error);
				return fail(500, { error: "EMAIL_UPDATE_FAILED" });
			}
		}

		if (name === authRes.user.name) {
			logger.debug("Name is unchanged, skipping update");
			return { success: true };
		}

		try {
			const res = await auth.api.updateUser({
				body: {
					name: String(name),
				},
				headers: request.headers,
			});

			if (!res.status) {
				logger.error("Failed to update account details:", res);
				return fail(500, { error: "ACCOUNT_UPDATE_FAILED" });
			}

			return { success: true };
		} catch (error) {
			logger.error("Error updating account details:", error);
			return fail(500, { error: "ACCOUNT_UPDATE_FAILED" });
		}
	},
};
