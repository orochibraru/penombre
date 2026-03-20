import { fail } from "@sveltejs/kit";
import { Logger } from "$lib/logger";
import { auth } from "$lib/server/auth";
import { getPenombreConfig } from "$lib/server/config";

export const load = () => {};

const logger = new Logger("account-page.server.ts");

export const actions = {
	updateAccount: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const email = formData.get("email");

		if (!name || !email) {
			return fail(400, { error: "Name and email are required" });
		}

		const config = getPenombreConfig();

		// Here you would typically update the user's account details in your database
		logger.debug("Updating account with name:", name, "and email:", email);

		const authRes = await auth.api.getSession({ headers: request.headers });
		if (!authRes?.user) {
			logger.error("No authenticated user found in session");
			return fail(401, { error: "Unauthorized" });
		}

		if (email !== authRes.user.email) {
			if (!config.smtp?.enabled) {
				logger.error("Attempted email change without SMTP enabled");
				return fail(400, {
					error: "Email change is not allowed without SMTP enabled",
				});
			}
			const emailRes = await auth.api.adminUpdateUser({
				body: {
					userId: authRes.user.id,
					data: {
						email: String(email),
					},
				},
				headers: request.headers,
			});
			logger.error("Email change attempted, which is not allowed");
			return fail(400, { error: "Email change is not allowed" });
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
				return fail(500, { error: "Failed to update account details" });
			}

			return { success: true };
		} catch (error) {
			logger.error("Error updating account details:", error);
			return fail(500, {
				error: "An unexpected error occurred while updating account details",
			});
		}
	},
};
