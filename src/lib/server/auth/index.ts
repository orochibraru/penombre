import process from "node:process";
import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
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
import { building, dev } from "$app/environment";
import { getRequestEvent } from "$app/server";
import { Logger } from "$lib/logger";
import { getConfig, isSmtpEnabled } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { isSqliteDialect } from "$lib/server/db/dialect";
import * as schema from "$lib/server/db/schema";
import { Email } from "$lib/server/email";
import {
	getPasswordlessSettings,
	getStoredOAuthProviders,
	isEmailSignInEnabled,
} from "$lib/server/services/app-settings";
import { StorageService } from "$lib/server/services/storage";

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
		window: 15 * 60 * 1000, // 15 minutes
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
		passkey(),
		admin(),
		// Always loaded, never gated: an account must be able to enrol and to
		// answer a challenge even when the admin has not made 2FA mandatory.
		// The `requireTwoFactor` setting only decides who is forced to enrol.
		twoFactor({
			issuer: "Penombre",
		}),
		...(passwordless.magicLink
			? [
					magicLink({
						// Only ever sent to an address that already has an account:
						// signup stays closed unless the admin opened it.
						disableSignUp: true,
						sendMagicLink: async ({ email, url }) => {
							const message = await Email.create({
								to: email,
								subject: "Your sign-in link",
								content: `Use this link to sign in: ${url}\n\nIt expires shortly and can only be used once. If you did not ask for it, ignore this email.`,
							});
							await message.send();
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
							const message = await Email.create({
								to: email,
								subject,
								content: `Your code is ${otp}\n\nIt expires shortly. If you did not ask for it, ignore this email.`,
							});
							await message.send();
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
