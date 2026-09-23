import process from "node:process";
import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import {
	admin,
	bearer,
	emailOTP,
	genericOAuth,
	magicLink,
	openAPI,
	twoFactor,
} from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { Logger } from "#lib/logger.js";
import { getConfig, isSmtpEnabled } from "#lib/server/config.js";
import { isSqliteDialect } from "#lib/server/db/dialect.js";
import { getDb } from "#lib/server/db/index.js";
import * as schema from "#lib/server/db/schema.js";
import { Email } from "#lib/server/email.js";
import {
	assertCanDeleteAccount,
	LastAdminError,
	OwnsSharedDriveError,
} from "#lib/server/services/account-deletion.js";
import {
	getPasswordlessSettings,
	getStoredOAuthProviders,
	isEmailSignInEnabled,
	isOAuthSignInEnabled,
	isPasskeySignInEnabled,
} from "#lib/server/services/app-settings.js";
import type { InstanceMethods } from "#lib/server/services/auth-methods.js";
import { StorageService } from "#lib/server/services/storage/index.js";
import { building, dev } from "$app/env";
import { getRequestEvent } from "$app/server";

const logger = new Logger("Auth");

if (!(process.env.ORIGIN || dev || building)) {
	throw new Error("ORIGIN environment variable is not set");
}

const config = getConfig();

/**
 * Every sign-in method this instance answers right now, read live: each one is
 * gated per request in `hooks.before`, so a toggle saved in the admin UI takes
 * effect on the next request, in every app process.
 */
export async function instanceSignInMethods(): Promise<InstanceMethods> {
	const [password, passkey, passwordless] = await Promise.all([
		isEmailSignInEnabled(),
		isPasskeySignInEnabled(),
		getPasswordlessSettings(),
	]);
	return { password, passkey, ...passwordless };
}

/** Endpoints refused while their method is off; the plugins stay loaded. */
const METHOD_GATES: {
	matches: (path: string) => boolean;
	enabled: () => Promise<boolean>;
	name: string;
}[] = [
	{
		name: "Password sign-in",
		matches: (path) =>
			path === "/sign-in/email" ||
			path === "/request-password-reset" ||
			path.startsWith("/reset-password"),
		enabled: isEmailSignInEnabled,
	},
	{
		name: "Passkey sign-in",
		matches: (path) =>
			path === "/passkey/generate-authenticate-options" ||
			path === "/passkey/verify-authentication" ||
			path === "/passkey/generate-register-options" ||
			path === "/passkey/verify-registration",
		enabled: isPasskeySignInEnabled,
	},
	{
		name: "Magic link sign-in",
		matches: (path) =>
			path === "/sign-in/magic-link" || path === "/magic-link/verify",
		enabled: async () => (await getPasswordlessSettings()).magicLink,
	},
	{
		name: "Email code sign-in",
		matches: (path) =>
			path === "/sign-in/email-otp" ||
			path === "/forget-password/email-otp" ||
			path.startsWith("/email-otp/"),
		enabled: async () => (await getPasswordlessSettings()).emailOtp,
	},
	{
		name: "OAuth sign-in",
		matches: (path) =>
			path === "/sign-in/oauth2" ||
			path === "/sign-in/social" ||
			path.startsWith("/oauth2/") ||
			path.startsWith("/callback/"),
		enabled: isOAuthSignInEnabled,
	},
];

interface OAuthProvider {
	name: string;
	clientId: string;
	clientSecret: string;
	discoveryUrl: string;
	pkce: boolean;
	prettyName?: string;
	scopes: string[];
	enabled: boolean;
}

// Env wins on a name collision: `config.ts` is the source of truth for
// anything declared there, and the UI shows those read-only.
async function resolveOAuthProviders(): Promise<OAuthProvider[]> {
	const stored = await getStoredOAuthProviders().catch(() => []);
	const envNames = new Set(config.auth.oauthProviders.map((p) => p.name));
	return [
		...config.auth.oauthProviders,
		...stored
			.filter((provider) => !envNames.has(provider.name))
			.map((provider) => ({
				name: provider.name,
				clientId: provider.clientId,
				clientSecret: provider.clientSecret,
				discoveryUrl: provider.discoveryUrl,
				pkce: provider.pkce ?? true,
				prettyName: provider.prettyName,
				scopes: provider.scopes ?? ["openid", "profile", "email"],
				enabled: provider.enabled ?? true,
			})),
	];
}

/**
 * Send a sign-in email, turning a transport failure into something the caller
 * can read.
 *
 * Both passwordless plugins hand their send straight to us, and neither
 * reports a throw usefully: `magicLink` awaits it inline, so a nodemailer
 * rejection surfaced as a 500 with an empty body and the sign-in page fell
 * back to "there was an error" — nothing an admin could act on. `emailOTP`
 * runs it through `runInBackgroundOrAwait`, which swallows the failure and
 * answers `{ success: true }` for a code that was never sent.
 *
 * So: log the real reason at error level whichever path is taken, and rethrow
 * as an `APIError` whose message reaches the client when the plugin awaits.
 */
async function sendSignInEmail(
	to: string,
	subject: string,
	content: string,
): Promise<void> {
	try {
		const message = await Email.create({ to, subject, content });
		await message.send();
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		// The domain is enough to spot "every gmail.com address fails" without
		// putting a full address in the log.
		const domain = to.split("@")[1] ?? "unknown";
		logger.error(`Could not send "${subject}" to @${domain}: ${reason}`);
		throw new APIError("INTERNAL_SERVER_ERROR", {
			message: `Could not send the sign-in email: ${reason}`,
		});
	}
}

/** `assertCanDeleteAccount`'s own errors, translated into what the client reads. */
async function guardAccountDeletion(user: {
	id: string;
	role?: string | null;
}): Promise<void> {
	try {
		await assertCanDeleteAccount(user);
	} catch (error) {
		if (
			error instanceof LastAdminError ||
			error instanceof OwnsSharedDriveError
		) {
			throw new APIError("BAD_REQUEST", { message: error.message });
		}
		throw error;
	}
}

function authPlugins(oauthProviders: OAuthProvider[]) {
	return [
		openAPI({
			path: "/openapi",
			disableDefaultReference: true,
		}),
		passkey({
			rpName: config.appName,
			// `requireSession: false` does NOT mean anonymous registration:
			// without a session the plugin still refuses (no `resolveUser` is
			// configured), and the challenge is bound to the user who asked
			// for it. What it drops is better-auth's *freshness* middleware,
			// which 403s a session older than 24h — on a homelab drive people
			// stay signed in for weeks, so enrolling a passkey was rejected
			// for everyone but someone who had just signed in.
			registration: { requireSession: false },
		}),
		admin(),
		// Always loaded, never gated: an account must be able to enrol and to
		// answer a challenge even when the admin has not made 2FA mandatory.
		// The `requireTwoFactor` setting only decides who is forced to enrol.
		twoFactor({ issuer: "Penombre" }),

		magicLink({
			// Only ever sent to an address that already has an account:
			// signup stays closed unless the admin opened it.
			disableSignUp: true,
			sendMagicLink: async ({ email, url }) => {
				await sendSignInEmail(
					email,
					"Your sign-in link",
					`Use this link to sign in: ${url}\n\nIt expires shortly and can only be used once. If you did not ask for it, ignore this email.`,
				);
			},
		}),
		emailOTP({
			disableSignUp: true,
			sendVerificationOTP: async ({ email, otp, type }) => {
				const subject =
					type === "sign-in" ? "Your sign-in code" : "Your verification code";
				await sendSignInEmail(
					email,
					subject,
					`Your code is ${otp}\n\nIt expires shortly. If you did not ask for it, ignore this email.`,
				);
			},
		}),
		bearer(),
		apiKey({
			enableSessionForAPIKeys: true,
			rateLimit: {
				enabled: !dev,
				timeWindow: 60 * 1000, // 1 minute
				maxRequests: 100,
			},
		}),
		genericOAuth({
			config: oauthProviders.map((provider) => ({
				providerId: provider.name,
				clientId: provider.clientId,
				clientSecret: provider.clientSecret,
				discoveryUrl: provider.discoveryUrl,
				pkce: provider.pkce,
				scopes: provider.scopes,
				enabled: provider.enabled,
			})),
		}),
		// Must stay last: it forwards `Set-Cookie` to SvelteKit's cookie store,
		// so any plugin whose `hooks.after` runs later would lose its cookies.
		sveltekitCookies(getRequestEvent),
	] as const;
}

function buildAuth(oauthProviders: OAuthProvider[]) {
	return betterAuth({
		baseURL: config.origin
			? config.origin
			: dev
				? "http://localhost:5173"
				: (() => {
						throw new Error("ORIGIN environment variable is not set");
					})(),
		trustedOrigins: dev
			? ["http://localhost:*/**", "http://192.168.*.*:*/**"]
			: [config.origin],
		secret: config.auth.secret,
		basePath: "/api/v1/auth",
		rateLimit: {
			window: 15 * 60, // 15 minutes (better-auth takes seconds here)
			max: 100, // limit each IP to 100 requests per window
			enabled: !dev, // Disable rate limiting in development for easier testing
		},
		logger: {
			level: dev ? "debug" : config.logLevel,
			log: (level, message, ...metadata) => {
				// Send logs to a custom logging service
				logger.log({
					level,
					message,
					metadata,
				});
			},
		},
		database: drizzleAdapter(getDb(), {
			provider: isSqliteDialect() ? "sqlite" : "pg",
			schema,
		}),
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				const gate = METHOD_GATES.find((g) => g.matches(ctx.path));
				if (gate && !(await gate.enabled())) {
					throw new APIError("FORBIDDEN", {
						message: `${gate.name} is disabled on this instance.`,
					});
				}
			}),
			after: createAuthMiddleware(async (ctx) => {
				const session = ctx.context.session;
				const data = ctx.context.returned;
				// @ts-expect-error - BetterAuth types are not great, so we need to assert the type here
				if (data?.url) {
					// @ts-expect-error - BetterAuth types are not great, so we need to assert the type here
					const redirectUrl = new URL(data.url as string);
					logger.debug("Redirect URL:", redirectUrl);
				}
				if (session) {
					const storageService = new StorageService(session.user);
					try {
						await storageService.ensureUserDirectory();
					} catch (error) {
						logger.error("Error creating user storage directory:", error);
					}
				}
			}),
		},
		emailAndPassword: {
			enabled: true,
			disableSignUp: true,
			minPasswordLength: config.auth.minPasswordLength,
		},
		emailVerification: {
			sendOnSignUp: isSmtpEnabled(),
			sendVerificationEmail: async (params) => {
				const fullUrl = new URL(params.url);
				// If not hostname, add it
				if (!fullUrl.hostname) {
					fullUrl.hostname = "localhost:5173"; // Change this to your frontend domain
					fullUrl.protocol = "http:"; // or 'https:' in production
				}
				const email = await Email.create({
					to: params.user.email,
					subject: "Verify your email address",
					content: `Click the link to verify your email: ${fullUrl.toString()}`,
				});
				await email.send();
			},
		},
		user: {
			deleteUser: {
				enabled: true,
				beforeDelete: guardAccountDeletion,
			},
		},
		plugins: [...authPlugins(oauthProviders)],
	});
}

type Auth = ReturnType<typeof buildAuth>;

/**
 * The OAuth provider list is part of better-auth's configuration, not
 * something a request can gate, so a saved provider means a new instance.
 * `auth` stays one object for every importer and forwards to the current one.
 */
let current: { auth: Auth; providers: OAuthProvider[]; key: string };
{
	const providers = await resolveOAuthProviders();
	current = {
		auth: buildAuth(providers),
		providers,
		key: JSON.stringify(providers),
	};
}
let refreshing: Promise<void> | undefined;

export const auth: Auth = new Proxy({} as Auth, {
	get: (_target, prop) => Reflect.get(current.auth, prop, current.auth),
});

/**
 * Rebuild the instance if the stored providers changed, whoever changed them:
 * the admin action calls it, and every OAuth request checks, so another app
 * process picks a new provider up on its first use.
 */
export function refreshAuth(): Promise<void> {
	refreshing ??= (async () => {
		try {
			const providers = await resolveOAuthProviders();
			const key = JSON.stringify(providers);
			if (key !== current.key) {
				current = { auth: buildAuth(providers), providers, key };
				logger.info("OAuth providers changed, auth reloaded");
			}
		} finally {
			refreshing = undefined;
		}
	})();
	return refreshing;
}

/** The providers the current instance registered, public fields only. */
export async function loadedOAuthProviders(): Promise<
	{ name: string; prettyName: string; enabled: boolean }[]
> {
	await refreshAuth();
	return current.providers.map((provider) => ({
		name: provider.name,
		prettyName: provider.prettyName ?? provider.name,
		enabled: provider.enabled,
	}));
}

export interface AuthType {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
}
