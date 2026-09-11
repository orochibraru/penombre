import { auth } from "$lib/server/auth";
import { getConfig } from "$lib/server/config";
import { isTwoFactorRequired } from "$lib/server/services/app-settings";

export const load = async ({ request, locals }) => {
	const [apiKeys, passkeys, accounts] = await Promise.all([
		auth.api.listApiKeys({ headers: request.headers }),
		auth.api.listPasskeys({ headers: request.headers }),
		auth.api.listUserAccounts({ headers: request.headers }),
	]);

	// An OAuth-only account has no "credential" row, so there is no current
	// password to ask for — it gets "set" instead of "change".
	const hasPassword = accounts.some((a) => a.providerId === "credential");

	return {
		apiKeys,
		passkeys,
		hasPassword,
		emailSignInEnabled: getConfig().auth.enableEmailSignIn,
		twoFactorEnabled: !!locals.user?.twoFactorEnabled,
		twoFactorRequired: await isTwoFactorRequired(),
	};
};

export const actions = {
	createApiKey: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		if (typeof name !== "string" || !name.trim()) {
			return { success: false, error: "API key name is required." };
		}
		try {
			const newApiKey = await auth.api.createApiKey({
				headers: request.headers,
				body: {
					name,
				},
			});
			return { success: true, apiKey: newApiKey.key };
		} catch (error) {
			return {
				success: false,
				error: (error as Error).message || "Failed to create API key.",
			};
		}
	},
	setPassword: async ({ request }) => {
		const formData = await request.formData();
		const newPassword = formData.get("newPassword");
		const newPasswordConfirm = formData.get("newPasswordConfirm");

		if (
			typeof newPassword !== "string" ||
			typeof newPasswordConfirm !== "string"
		) {
			return { success: false, error: "Invalid form submission." };
		}

		if (newPassword !== newPasswordConfirm) {
			return { success: false, error: "New passwords do not match." };
		}

		const { auth: authConfig } = getConfig();
		if (!authConfig.enableEmailSignIn) {
			return { success: false, error: "Email sign-in is disabled." };
		}

		if (newPassword.length < authConfig.minPasswordLength) {
			return {
				success: false,
				error: `Password must be at least ${authConfig.minPasswordLength} characters.`,
			};
		}

		try {
			// Only succeeds when the account has no credential row yet —
			// better-auth rejects it otherwise, so this can't overwrite an
			// existing password without knowing the current one.
			await auth.api.setPassword({
				headers: request.headers,
				body: { newPassword },
			});
			return { success: true, passwordSet: true };
		} catch (error) {
			return {
				success: false,
				error: (error as Error).message || "Failed to set password.",
			};
		}
	},
	changePassword: async ({ request }) => {
		const formData = await request.formData();
		const currentPassword = formData.get("currentPassword");
		const newPassword = formData.get("newPassword");
		const newPasswordConfirm = formData.get("newPasswordConfirm");

		if (
			typeof currentPassword !== "string" ||
			typeof newPassword !== "string" ||
			typeof newPasswordConfirm !== "string"
		) {
			return { success: false, error: "Invalid form submission." };
		}

		if (newPassword !== newPasswordConfirm) {
			return { success: false, error: "New passwords do not match." };
		}

		try {
			await auth.api.changePassword({
				headers: request.headers,
				body: {
					currentPassword,
					newPassword,
				},
			});
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: (error as Error).message || "Failed to change password.",
			};
		}
	},
};
