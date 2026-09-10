import { fail } from "@sveltejs/kit";
import { getConfig } from "$lib/server/config";
import {
	getAppSettings,
	updateAppSettings,
} from "$lib/server/services/app-settings";

export const load = async () => {
	const config = getConfig();

	return {
		settings: await getAppSettings(),
		// Env-provided values are shown read-only: `config.ts` owns them, and
		// letting the UI write them would give two sources of truth.
		env: {
			emailSignIn: config.auth.enableEmailSignIn,
			oauthSignIn: config.auth.enableOAuthSignIn,
			minPasswordLength: config.auth.minPasswordLength,
			providers: config.auth.oauthProviders.map((provider) => ({
				name: provider.name,
				prettyName: provider.prettyName ?? provider.name,
				enabled: provider.enabled,
			})),
		},
	};
};

/** Checkbox inputs only appear in the body when ticked. */
const bool = (form: FormData, name: string) => form.get(name) === "on";

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();

		const minLength = Number(form.get("minPasswordLength"));
		if (!Number.isFinite(minLength) || minLength < 8 || minLength > 128) {
			return fail(400, { error: "Password length must be between 8 and 128." });
		}

		// Stored lowercased and de-duplicated so the check at signup is a
		// straight comparison.
		const domains = String(form.get("allowedEmailDomains") ?? "")
			.split(/[\s,]+/)
			.map((d) => d.trim().replace(/^@/, "").toLowerCase())
			.filter(Boolean);

		try {
			await updateAppSettings({
				requirePasskey: bool(form, "requirePasskey"),
				allowSignups: bool(form, "allowSignups"),
				requireStrongPassword: bool(form, "requireStrongPassword"),
				minPasswordLength: minLength,
				allowedEmailDomains: [...new Set(domains)],
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error).message });
		}
	},
};
