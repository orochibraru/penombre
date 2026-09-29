import { getConfig } from "#lib/server/config.js";
import { getAppSettings } from "#lib/server/services/app-settings.js";

export interface PasswordRules {
	minLength: number;
	requireStrong: boolean;
}

/** The environment's minimum or the admin's, whichever is stricter. */
export async function passwordRules(): Promise<PasswordRules> {
	const settings = await getAppSettings();
	return {
		minLength: Math.max(
			getConfig().auth.minPasswordLength,
			settings.minPasswordLength ?? 8,
		),
		requireStrong: settings.requireStrongPassword ?? false,
	};
}

/** Mixed case, a digit and a symbol. */
function isStrong(password: string): boolean {
	return (
		/[a-z]/.test(password) &&
		/[A-Z]/.test(password) &&
		/\d/.test(password) &&
		/[^A-Za-z0-9]/.test(password)
	);
}

/**
 * What is wrong with a new password, as a form error, or null. better-auth
 * only knows the environment's minimum, so every form that sets one checks
 * here first.
 */
export function passwordProblem(
	password: string,
	confirm: string,
	rules: PasswordRules,
): { error: string; errorParams?: { count: string } } | null {
	if (password !== confirm) {
		return { error: "PASSWORD_MISMATCH" };
	}
	if (password.length < rules.minLength) {
		return {
			error: "PASSWORD_TOO_SHORT",
			errorParams: { count: String(rules.minLength) },
		};
	}
	if (rules.requireStrong && !isStrong(password)) {
		return { error: "PASSWORD_NOT_STRONG" };
	}
	return null;
}
