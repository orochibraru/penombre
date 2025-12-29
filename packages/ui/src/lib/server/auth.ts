import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { genericOAuth, openAPI } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { Logger } from "$lib/logger";
import { getDb } from "$lib/server/db";
import { StorageService } from "$lib/server/dto/storage";
import * as schema from "./db/schema";

const logger = new Logger("Auth");

const origin = process.env.ORIGIN || "http://localhost:5173";
if (!process.env.ORIGIN) {
	logger.warn(
		"ORIGIN environment variable is not set. Defaulting to http://localhost:5173. Make sure to set it in production.",
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
		sveltekitCookies(getRequestEvent),
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

export type AuthType = {
	user: typeof auth.$Infer.Session.user | null;
	session: typeof auth.$Infer.Session.session | null;
};
