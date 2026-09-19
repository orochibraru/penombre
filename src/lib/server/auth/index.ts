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
	getPasswordlessSettings,
	getStoredOAuthProviders,
	isEmailSignInEnabled,
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
 * Providers configured in the admin UI, merged with the env-declared ones.
 *
 * Top-level await on purpose: better-auth builds its plugin list once at
 * module init, so this is the only point at which a stored provider can be
 * added. A provider saved later therefore needs a restart, which the admin UI
 * states. Failures fall back to env-only rather than blocking boot.
 */
const storedProviders = await getStoredOAuthProviders().catch(() => []);

// Same story for email sign-in: resolved once at init, so toggling it in the
// admin UI takes effect on the next restart.
const emailSignInEnabled = await isEmailSignInEnabled().catch(
	() => config.auth.enableEmailSignIn,
);

// Passwordless methods, resolved at init for the same reason. Both are
// already gated on SMTP being configured by `getPasswordlessSettings`.
const passwordless = await getPasswordlessSettings().catch(() => ({
	magicLink: false,
	emailOtp: false,
}));

/**
 * Every sign-in method this process can answer right now.
 *
 * The sign-in page must offer these rather than re-reading the settings:
 * a live read is true the moment an admin saves, but the plugin list was
 * built at module init, so the button appeared for an endpoint that did not
 * exist and posting to it 404'd with no message at all. Passkeys are the
 * exception: they are gated per request (`hooks.before`), so read live.
 */
export async function instanceSignInMethods(): Promise<InstanceMethods> {
	return {
		password: emailSignInEnabled,
		passkey: await isPasskeySignInEnabled(),
		...passwordless,
	};
}

/** Sign-in and enrolment; listing and deleting stay open when it is off. */
const PASSKEY_GATED = new Set([
	"/passkey/generate-authenticate-options",
	"/passkey/verify-authentication",
	"/passkey/generate-register-options",
	"/passkey/verify-registration",
]);

// Env wins on a name collision: `config.ts` is the source of truth for
// anything declared there, and the UI shows those read-only.
const envProviderNames = new Set(
	config.auth.oauthProviders.map((provider) => provider.name),
);
const oauthProviders = [
	...config.auth.oauthProviders,
	...storedProviders
		.filter((provider) => !envProviderNames.has(provider.name))
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

/**
 * The providers this process actually registered, public fields only.
 *
 * Same reason as `instanceSignInMethods`: one saved in the admin UI has no
 * endpoint until the next boot, so a page offering it beforehand would post
 * to a 404. Never the client id or secret — this is read by the sign-in page.
 */
export const loadedOAuthProviders = oauthProviders.map((provider) => ({
	name: provider.name,
	prettyName: provider.prettyName ?? provider.name,
	enabled: provider.enabled,
}));

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
		logger.error(`Could not send "${subject}" to ${to}: ${reason}`);
		throw new APIError("INTERNAL_SERVER_ERROR", {
			message: `Could not send the sign-in email: ${reason}`,
		});
	}
}

export const auth = betterAuth({
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
			if (PASSKEY_GATED.has(ctx.path) && !(await isPasskeySignInEnabled())) {
				throw new APIError("FORBIDDEN", {
					message: "Passkey sign-in is disabled on this instance.",
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
		enabled: emailSignInEnabled,
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
	plugins: [
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

		...(passwordless.magicLink
			? [
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
				]
			: []),
		...(passwordless.emailOtp
			? [
					emailOTP({
						disableSignUp: true,
						sendVerificationOTP: async ({ email, otp, type }) => {
							const subject =
								type === "sign-in"
									? "Your sign-in code"
									: "Your verification code";
							await sendSignInEmail(
								email,
								subject,
								`Your code is ${otp}\n\nIt expires shortly. If you did not ask for it, ignore this email.`,
							);
						},
					}),
				]
			: []),
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
	],
});

export interface AuthType {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
}
