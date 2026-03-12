import { apiKey } from "@better-auth/api-key";
import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin, bearer, genericOAuth, openAPI } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { building, dev } from "$app/environment";
import { getRequestEvent } from "$app/server";
import { Logger } from "$lib/logger";
import { getPenombreConfig, isSmtpEnabled } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { Email } from "$lib/server/email";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("Auth");

if (!process.env.ORIGIN && !dev && !building) {
	throw new Error("ORIGIN environment variable is not set");
}

const config = getPenombreConfig();

export const auth = betterAuth({
	baseURL: config.origin
		? config.origin
		: dev
			? "http://localhost:5173"
			: (() => {
					throw new Error("ORIGIN environment variable is not set");
				})(),
	trustedOrigins: dev
		? [
				"penombre://*/**",
				"http://localhost:*/**",
				"http://192.168.*.*:*/**",
				"exp://localhost:*/**",
				"exp://192.168.*.*:*/**",
			]
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
		provider: "pg",
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
		enabled: config.auth.enableEmailSignIn,
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
			const email = new Email({
				to: params.user.email,
				subject: "Verify your email address",
				content: `Click the link to verify your email: ${fullUrl.toString()}`,
			});
			await email.send();
		},
	},
	plugins: [
		sveltekitCookies(getRequestEvent),
		openAPI({
			path: "/openapi",
			disableDefaultReference: true,
		}),
		passkey(),
		admin(),
		expo(),
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
			config: config.auth.oauthProviders.map((provider) => ({
				providerId: provider.name,
				clientId: provider.clientId,
				clientSecret: provider.clientSecret,
				discoveryUrl: provider.discoveryUrl,
				pkce: provider.pkce,
				scopes: provider.scopes,
				enabled: provider.enabled,
			})),
		}),
	],
});

export type AuthType = {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
};
