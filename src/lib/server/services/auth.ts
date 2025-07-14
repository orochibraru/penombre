import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware, emailOTP, genericOAuth, openAPI } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { authBasePath } from '$lib/client/auth';
import { StorageService } from '$lib/server/services/storage';
import { db } from '../db/index';

export function oAuthReady(): boolean {
	let ready = true;
	const requiredOauthVars = ['OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET'];
	for (const envVar of requiredOauthVars) {
		if (!env[envVar]) {
			ready = false;
		}
	}

	return ready;
}

export const auth = betterAuth({
	basePath: authBasePath,
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.includes('/oauth2/callback')) {
				const user = ctx.context.newSession?.user;
				if (user) {
					const storage = new StorageService(user);
					await storage.ensureUserBucket();
				}
			}
		})
	},
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: false
	},
	plugins: [
		openAPI({
			disableDefaultReference: true
		}),
		emailOTP({
			async sendVerificationOTP() {
				// Implement the sendVerificationOTP method to send the OTP to the user's email address
			}
		}),
		genericOAuth({
			config: [
				{
					providerId: 'pocket-id',
					clientId: env.OAUTH_CLIENT_ID as string,
					clientSecret: env.OAUTH_CLIENT_SECRET as string,
					discoveryUrl: 'https://auth.ombrage.space/.well-known/openid-configuration',
					scopes: ['openid', 'email', 'profile']
				}
			]
		})
	]
});
