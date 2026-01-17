import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin, genericOAuth, openAPI } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { dev } from "$app/environment";
import { getRequestEvent } from "$app/server";
import { Logger } from "$lib/logger";
import { getOpendriveConfig, isSmtpEnabled } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import { Email } from "$lib/server/email";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("Auth");

if (!process.env.ORIGIN && !dev) {
	throw new Error("ORIGIN environment variable is not set");
}

const config = getOpendriveConfig();

export const auth = betterAuth({
	baseURL: dev ? "http://localhost:5173" : config.origin,
	secret: config.auth.secret,
	logger: {
		level: config.logLevel,
		log: (level, message, ...metadata) => {
			// Send logs to a custom logging service
			logger.log({
				level,
				message,
				metadata,
			});
		},
	},
	trustedOrigins: dev
		? [
				"http://localhost:5173",
				"http://localhost:4173",
				"http://localhost:3000",
			]
		: [config.origin],
	database: drizzleAdapter(getDb(), {
		provider: "pg",
		schema,
	}),
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			const session = ctx.context.session;
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
		admin(),
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
