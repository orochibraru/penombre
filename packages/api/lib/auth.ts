import { getDb } from "@lib/db";
import { logger } from "@lib/logger";
import { StorageService } from "@lib/storage";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { genericOAuth, openAPI } from "better-auth/plugins";
import * as schema from "./db/schema";

const origin = process.env.ORIGIN || "http://localhost:8080";
if (!process.env.ORIGIN) {
	logger.warn(
		"ORIGIN environment variable is not set. Defaulting to http://localhost:8080. Make sure to set it in production.",
	);
}

export const auth = betterAuth({
	basePath: "/api/auth",
	baseURL: origin,
	database: drizzleAdapter(getDb(), {
		provider: "pg",
		schema,
	}),
	advanced: {
		// Use X-Forwarded headers to determine the real origin
		// This is needed because SSR calls localhost:8080 internally
		useSecureCookies: origin.startsWith("https://"),
	},
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
	trustedOrigins: ["http://localhost:5173", "http://localhost:8080", origin],
	plugins: [
		openAPI({
			path: "/openapi",
			disableDefaultReference: true,
		}),
		genericOAuth({
			config: [
				{
					providerId: "pocket-id",
					clientId: "05a0dd79-385f-44d2-9632-1ffcec1cda51",
					clientSecret: "U8QJvEK8aWOThbG53q4yI34YePngDcU8",
					discoveryUrl:
						"https://auth.ombrage.space/.well-known/openid-configuration",
					pkce: true,
					scopes: ["openid", "profile", "email"],
				},
			],
		}),
	],
});
