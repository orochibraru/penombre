import { fail } from "@sveltejs/kit";
import { Logger } from "#lib/logger.js";
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

const logger = new Logger("account/security");

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
			return fail(401, { error: "UNAUTHORIZED" });
		}
		const value = String((await request.formData()).get("method") ?? "");
		const available = methodsFor(
			await instanceSignInMethods(),
			await accountCredentials(locals.user.id),
		);
		const method = effectivePreferred(value as SignInMethod, available);
		if (value && !method) {
			return fail(400, { error: "SIGN_IN_METHOD_UNAVAILABLE" });
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
			return { success: false, error: "API_KEY_NAME_REQUIRED" };
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
			logger.error("Failed to create an API key:", error);
			return { success: false, error: "API_KEY_CREATE_FAILED" };
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
			return { success: false, error: "INVALID_FORM" };
		}

		if (newPassword !== newPasswordConfirm) {
			return { success: false, error: "PASSWORD_MISMATCH" };
		}

		const { auth: authConfig } = getConfig();
		if (!authConfig.enableEmailSignIn) {
			return { success: false, error: "EMAIL_SIGNIN_DISABLED" };
		}

		if (newPassword.length < authConfig.minPasswordLength) {
			return {
				success: false,
				error: "PASSWORD_TOO_SHORT",
				errorParams: { count: String(authConfig.minPasswordLength) },
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
			logger.error("Failed to set a password:", error);
			return { success: false, error: "SET_PASSWORD_FAILED" };
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
			return { success: false, error: "INVALID_FORM" };
		}

		if (newPassword !== newPasswordConfirm) {
			return { success: false, error: "PASSWORD_MISMATCH" };
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
			logger.error("Failed to change a password:", error);
			return {
				success: false,
				error: "CHANGE_PASSWORD_FAILED",
			};
		}
	},
};
