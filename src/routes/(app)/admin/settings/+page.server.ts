import { fail } from "@sveltejs/kit";
import { envProvided, getConfig } from "$lib/server/config";
import { Email } from "$lib/server/email";
import {
	getAppSettings,
	getSmtpSettings,
	updateAppSettings,
} from "$lib/server/services/app-settings";
import {
	getSignInMethodUsage,
	usersWithoutTwoFactor,
	validateSignInMethods,
} from "$lib/server/services/auth-methods";

/** OAuth provider ids currently able to authenticate, env and stored merged. */
function enabledOAuthProviders(
	config: ReturnType<typeof getConfig>,
	stored: Awaited<ReturnType<typeof getAppSettings>>,
): string[] {
	const fromEnv = config.auth.oauthProviders
		.filter((provider) => provider.enabled)
		.map((provider) => provider.name);
	const fromDb = (stored.oauthProviders ?? [])
		.filter((provider) => provider.enabled !== false)
		.map((provider) => provider.name);
	return [...new Set([...fromEnv, ...fromDb])];
}

export const load = async () => {
	const config = getConfig();

	const provided = envProvided();
	const settings = await getAppSettings();

	return {
		settings,
		// Which knobs the environment has claimed. Anything it has not is
		// editable here; anything it has is shown locked.
		provided,
		// Whether mail can actually be sent — the passwordless methods are
		// unusable without it, so the UI disables them rather than offering a
		// toggle that would be refused on save.
		smtpAvailable: !!(await getSmtpSettings()),
		// Shown next to the sign-in toggles so an admin can see what turning
		// one off would strand before they try it.
		usage: await getSignInMethodUsage(),
		twoFactorPending: await usersWithoutTwoFactor(),
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
	/**
	 * Send a test message using the values currently in the form.
	 *
	 * Deliberately not the saved ones: the point is to find out whether a
	 * configuration works *before* committing it, so this reads the posted
	 * fields and builds a one-off sender from them.
	 */
	testEmail: async ({ request, locals }) => {
		const form = await request.formData();
		const to = locals.user?.email;
		if (!to) {
			return fail(401, { error: "Sign in again to send a test email." });
		}

		const provided = envProvided();
		const port = Number(form.get("smtpPort") || 587);

		// When the environment owns SMTP the form has no fields to read, so
		// fall through to the configured transport.
		const override = provided.smtp
			? undefined
			: {
					enabled: true,
					host: text(form, "smtpHost"),
					port,
					user: text(form, "smtpUser"),
					password: String(form.get("smtpPassword") ?? ""),
					from: text(form, "smtpFrom"),
					secure: bool(form, "smtpSecure"),
				};

		if (override && !(override.host && override.from)) {
			return fail(400, {
				error: "Fill in the SMTP host and from address before testing.",
			});
		}

		const message = {
			to,
			subject: "Penombre SMTP test",
			content:
				"This is a test message from your Penombre instance.\n\nIf you are reading it, outgoing mail works.",
		};

		try {
			const email = override
				? new Email(message, override)
				: await Email.create(message);
			await email.send();
			return { tested: to };
		} catch (error) {
			return fail(400, {
				error: `Could not send: ${(error as Error).message}`,
			});
		}
	},

	save: async ({ request }) => {
		const form = await request.formData();

		const minLength = Number(form.get("minPasswordLength"));
		if (!Number.isFinite(minLength) || minLength < 8 || minLength > 128) {
			return fail(400, { error: "Password length must be between 8 and 128." });
		}

		const provided = envProvided();
		const config = getConfig();
		const current = await getAppSettings();
		const smtpPort = Number(form.get("smtpPort") || 587);

		const smtpProblem = provided.smtp ? null : smtpError(form, smtpPort);
		if (smtpProblem) {
			return fail(400, { error: smtpProblem });
		}

		// The environment keeps ownership of email sign-in when it declares it,
		// so the proposed value is the env one rather than whatever was posted.
		const nextEmailSignIn = provided.emailSignIn
			? config.auth.enableEmailSignIn
			: bool(form, "emailSignInEnabled");
		const nextMagicLink = bool(form, "magicLinkEnabled");
		const nextEmailOtp = bool(form, "emailOtpEnabled");

		// Judge SMTP by what is about to be saved, not what is stored: an admin
		// enabling mail and a passwordless method in the same submit should not
		// be told mail is missing.
		const smtpAfterSave = provided.smtp
			? !!(await getSmtpSettings())
			: bool(form, "smtpEnabled") &&
				!!text(form, "smtpHost") &&
				!!text(form, "smtpFrom");

		const oauthProviders = enabledOAuthProviders(config, current);
		const problem = await validateSignInMethods(
			{
				emailSignIn: nextEmailSignIn,
				magicLink: nextMagicLink,
				emailOtp: nextEmailOtp,
				oauthProviders,
				smtpAvailable: smtpAfterSave,
			},
			{
				emailSignIn: current.emailSignInEnabled ?? true,
				oauthProviders,
			},
		);
		if (problem) {
			return fail(400, { error: problem });
		}

		try {
			await updateAppSettings({
				requirePasskey: bool(form, "requirePasskey"),
				requireTwoFactor: bool(form, "requireTwoFactor"),
				allowSignups: bool(form, "allowSignups"),
				requireStrongPassword: bool(form, "requireStrongPassword"),
				minPasswordLength: minLength,
				allowedEmailDomains: domainsFromForm(form),
				magicLinkEnabled: nextMagicLink,
				emailOtpEnabled: nextEmailOtp,
				// Only writable when the environment has not claimed them.
				...(provided.emailSignIn
					? {}
					: { emailSignInEnabled: nextEmailSignIn }),
				...(provided.smtp ? {} : { smtp: smtpFromForm(form, smtpPort) }),
			});
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error).message });
		}
	},
};
