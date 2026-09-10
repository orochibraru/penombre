import { fail } from "@sveltejs/kit";
import { envProvided, getConfig } from "$lib/server/config";
import {
	getAppSettings,
	updateAppSettings,
} from "$lib/server/services/app-settings";

export const load = async () => {
	const config = getConfig();

	const provided = envProvided();

	return {
		settings: await getAppSettings(),
		// Which knobs the environment has claimed. Anything it has not is
		// editable here; anything it has is shown locked.
		provided,
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

const text = (form: FormData, name: string) =>
	String(form.get(name) ?? "").trim();

/** Validate the SMTP block, returning a message on the first problem. */
function smtpError(form: FormData, port: number): string | null {
	if (!bool(form, "smtpEnabled")) {
		return null;
	}
	if (!text(form, "smtpHost")) {
		return "An SMTP host is required.";
	}
	if (!text(form, "smtpFrom")) {
		return "A from address is required.";
	}
	if (!Number.isFinite(port) || port < 1 || port > 65_535) {
		return "SMTP port must be between 1 and 65535.";
	}
	return null;
}

/** Domains, normalised so the signup check is a straight comparison. */
function domainsFromForm(form: FormData): string[] {
	const domains = String(form.get("allowedEmailDomains") ?? "")
		.split(/[\s,]+/)
		.map((d) => d.trim().replace(/^@/, "").toLowerCase())
		.filter(Boolean);
	return [...new Set(domains)];
}

function smtpFromForm(form: FormData, port: number) {
	return {
		enabled: bool(form, "smtpEnabled"),
		host: text(form, "smtpHost"),
		port,
		user: text(form, "smtpUser"),
		password: String(form.get("smtpPassword") ?? ""),
		from: text(form, "smtpFrom"),
		secure: bool(form, "smtpSecure"),
	};
}

export const actions = {
	save: async ({ request }) => {
		const form = await request.formData();

		const minLength = Number(form.get("minPasswordLength"));
		if (!Number.isFinite(minLength) || minLength < 8 || minLength > 128) {
			return fail(400, { error: "Password length must be between 8 and 128." });
		}

		const provided = envProvided();
		const smtpPort = Number(form.get("smtpPort") || 587);

		const smtpProblem = provided.smtp ? null : smtpError(form, smtpPort);
		if (smtpProblem) {
			return fail(400, { error: smtpProblem });
		}

		try {
			await updateAppSettings({
				requirePasskey: bool(form, "requirePasskey"),
				allowSignups: bool(form, "allowSignups"),
				requireStrongPassword: bool(form, "requireStrongPassword"),
				minPasswordLength: minLength,
				allowedEmailDomains: domainsFromForm(form),
				// Only writable when the environment has not claimed them.
				...(provided.emailSignIn
					? {}
					: { emailSignInEnabled: bool(form, "emailSignInEnabled") }),
				...(provided.smtp ? {} : { smtp: smtpFromForm(form, smtpPort) }),
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error).message });
		}
	},
};
