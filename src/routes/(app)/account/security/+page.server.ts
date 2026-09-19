import { fail } from "@sveltejs/kit";
import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { getConfig } from "#lib/server/config.js";
import type { SignInMethod } from "#lib/server/db/schema.js";
import { isTwoFactorRequired } from "#lib/server/services/app-settings.js";
import {
	accountCredentials,
	effectivePreferred,
	methodsFor,
} from "#lib/server/services/auth-methods.js";
import {
	getUserPreferences,
	updateUserPreferences,
} from "#lib/server/services/preferences.js";

export const load = async ({ request, locals }) => {
	const [apiKeys, passkeys, accounts] = await Promise.all([
		auth.api.listApiKeys({ headers: request.headers }),
		auth.api.listPasskeys({ headers: request.headers }),
		auth.api.listUserAccounts({ headers: request.headers }),
	]);

	// An OAuth-only account has no "credential" row, so there is no current
	// password to ask for — it gets "set" instead of "change".
	const hasPassword = accounts.some((a) => a.providerId === "credential");

	const instance = await instanceSignInMethods();
	const signInMethods = methodsFor(instance, {
		hasPassword,
		hasPasskey: passkeys.length > 0,
	});
	const preferences = locals.user
		? await getUserPreferences(locals.user.id)
		: undefined;

	return {
		passkeySignInEnabled: instance.passkey,
		signInMethods,
		preferredSignInMethod: effectivePreferred(
			preferences?.preferredSignInMethod,
			signInMethods,
		),
		apiKeys,
		passkeys,
		hasPassword,
		emailSignInEnabled: getConfig().auth.enableEmailSignIn,
		twoFactorEnabled: !!locals.user?.twoFactorEnabled,
		twoFactorRequired: await isTwoFactorRequired(),
	};
};

export const actions = {
	setPreferredSignInMethod: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: "Sign in again." });
		}
		const value = String((await request.formData()).get("method") ?? "");
		const available = methodsFor(
			await instanceSignInMethods(),
			await accountCredentials(locals.user.id),
		);
		const method = effectivePreferred(value as SignInMethod, available);
		if (value && !method) {
			return fail(400, { error: "That sign-in method is not available." });
		}
		await updateUserPreferences(locals.user.id, {
			preferredSignInMethod: method,
		});
		return { preferredSaved: true };
	},
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
