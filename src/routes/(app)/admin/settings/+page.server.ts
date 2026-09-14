import { fail } from "@sveltejs/kit";
import { loadedOAuthProviders } from "$lib/server/auth";
import { envProvided, getConfig } from "$lib/server/config";
import type { AppSettingsData } from "$lib/server/db/schema";
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

type StoredProvider = NonNullable<AppSettingsData["oauthProviders"]>[number];

/** Provider ids the running process registered with better-auth. */
const loadedNames = new Set(loadedOAuthProviders.map((p) => p.name));

/**
 * The redirect URI the IdP has to be told about.
 *
 * `genericOAuth` registers each provider as an ordinary social provider, so
 * the callback is better-auth's core `callback/:id` under our `basePath`, not
 * a plugin route of its own.
 */
function callbackUrl(origin: string, name: string): string {
	return `${origin.replace(/\/$/, "")}/api/v1/auth/callback/${name}`;
}

/**
 * A provider id: lowercase, no spaces. It is part of a URL and is stored on
 * every `account` row, so it has to be stable and safe to put in a path.
 */
function slug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

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
		// Never the client secret: an admin page is still a page, and the
		// secret would be serialised into it. An empty secret field on save
		// means "keep the stored one".
		providers: (settings.oauthProviders ?? []).map((provider) => ({
			name: provider.name,
			prettyName: provider.prettyName ?? "",
			clientId: provider.clientId,
			discoveryUrl: provider.discoveryUrl,
			scopes: (provider.scopes ?? []).join(", "),
			pkce: provider.pkce ?? true,
			enabled: provider.enabled !== false,
			callbackUrl: callbackUrl(config.origin, provider.name),
			// Saved but not yet registered: better-auth builds its provider
			// list at boot, so this one cannot sign anyone in until a restart.
			pending: !loadedNames.has(provider.name),
		})),
		origin: config.origin,
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

/**
 * Refuse a change that would leave someone unable to sign in.
 *
 * Reuses the sign-in-method rules rather than inventing provider-specific
 * ones: removing the only provider an account has is the same mistake as
 * turning off the only method it has.
 */
async function providerChangeRefused(
	next: StoredProvider[],
): Promise<string | null> {
	const config = getConfig();
	const provided = envProvided();
	const current = await getAppSettings();

	const emailSignIn = provided.emailSignIn
		? config.auth.enableEmailSignIn
		: (current.emailSignInEnabled ?? true);

	return validateSignInMethods(
		{
			emailSignIn,
			magicLink: current.magicLinkEnabled ?? false,
			emailOtp: current.emailOtpEnabled ?? false,
			oauthProviders: enabledOAuthProviders(config, {
				...current,
				oauthProviders: next,
			}),
			smtpAvailable: !!(await getSmtpSettings()),
		},
		{
			emailSignIn,
			oauthProviders: enabledOAuthProviders(config, current),
		},
	);
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
	/**
	 * Add or update one OAuth provider.
	 *
	 * The id cannot change once saved: it is what every `account` row records,
	 * so renaming it would orphan everyone who signed in through it. Editing
	 * posts it back read-only and this treats a known id as an update.
	 */
	saveProvider: async ({ request }) => {
		const form = await request.formData();
		const name = slug(text(form, "providerName"));

		if (!name) {
			return fail(400, { error: "A provider id is required." });
		}
		if (getConfig().auth.oauthProviders.some((p) => p.name === name)) {
			return fail(400, {
				error: `"${name}" is declared in the environment — change it there.`,
			});
		}

		const discoveryUrl = text(form, "discoveryUrl");
		if (!URL.canParse(discoveryUrl)) {
			return fail(400, { error: "The discovery URL must be a full URL." });
		}

		const current = await getAppSettings();
		const providers = [...(current.oauthProviders ?? [])];
		const index = providers.findIndex((provider) => provider.name === name);
		const existing = providers[index];

		const clientId = text(form, "clientId");
		// Blank means unchanged: the stored secret is never sent to the page,
		// so an edit that did not retype it must not wipe it.
		const clientSecret =
			String(form.get("clientSecret") ?? "").trim() ||
			existing?.clientSecret ||
			"";
		if (!(clientId && clientSecret)) {
			return fail(400, {
				error: "A client id and client secret are required.",
			});
		}

		const scopes = text(form, "scopes")
			.split(/[\s,]+/)
			.filter(Boolean);

		const next: StoredProvider = {
			name,
			prettyName: text(form, "prettyName") || undefined,
			clientId,
			clientSecret,
			discoveryUrl,
			scopes: scopes.length > 0 ? scopes : undefined,
			pkce: bool(form, "pkce"),
			enabled: bool(form, "enabled"),
		};

		if (index >= 0) {
			providers[index] = next;
		} else {
			providers.push(next);
		}

		const refused = await providerChangeRefused(providers);
		if (refused) {
			return fail(400, { error: refused });
		}

		try {
			await updateAppSettings({ oauthProviders: providers });
			return { providerSaved: name };
		} catch (error) {
			return fail(500, { error: (error as Error).message });
		}
	},

	deleteProvider: async ({ request }) => {
		const form = await request.formData();
		const name = text(form, "providerName");
		const current = await getAppSettings();
		const providers = (current.oauthProviders ?? []).filter(
			(provider) => provider.name !== name,
		);

		const refused = await providerChangeRefused(providers);
		if (refused) {
			return fail(400, { error: refused });
		}

		try {
			await updateAppSettings({ oauthProviders: providers });
			return { providerRemoved: name };
		} catch (error) {
			return fail(500, { error: (error as Error).message });
		}
	},
};
