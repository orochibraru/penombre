import { fail } from "@sveltejs/kit";
import { Logger } from "#lib/logger.js";
import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { getConfig } from "#lib/server/config.js";
import type { SignInMethod } from "#lib/server/db/schema.js";
import {
	savePassword,
	setPreferredSignInMethod,
	unmetRequirements,
} from "#lib/server/services/account.js";
import { isTwoFactorRequired } from "#lib/server/services/app-settings.js";
import {
	effectivePreferred,
	methodsFor,
} from "#lib/server/services/auth-methods.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";

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
		requirements: locals.user ? await unmetRequirements(locals.user) : [],
	};
};

export const actions = {
	setPreferredSignInMethod: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: "UNAUTHORIZED" });
		}
		const value = String((await request.formData()).get("method") ?? "");
		const refused = await setPreferredSignInMethod(
			locals.user.id,
			(value || null) as SignInMethod | null,
		);
		if (refused) {
			return fail(400, { error: refused.error });
		}
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
	setPassword: ({ request }) => savePasswordFrom(request, "set"),
	changePassword: ({ request }) => savePasswordFrom(request, "change"),
};

async function savePasswordFrom(request: Request, mode: "set" | "change") {
	const formData = await request.formData();
	const current = formData.get("currentPassword");
	const newPassword = formData.get("newPassword");
	const confirm = formData.get("newPasswordConfirm");
	if (
		typeof newPassword !== "string" ||
		typeof confirm !== "string" ||
		(mode === "change" && typeof current !== "string")
	) {
		return { success: false, error: "INVALID_FORM" };
	}
	const refused = await savePassword(
		request.headers,
		{
			currentPassword: typeof current === "string" ? current : undefined,
			newPassword,
			confirm,
		},
		mode,
	);
	if (refused) {
		return {
			success: false,
			error: refused.error,
			...(refused.errorParams ? { errorParams: refused.errorParams } : {}),
		};
	}
	return mode === "set"
		? { success: true, passwordSet: true }
		: { success: true };
}
