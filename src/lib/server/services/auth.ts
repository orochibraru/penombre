import { env } from '$env/dynamic/private';
import { authBasePath } from '$lib/client/auth';
import { StorageService } from '$lib/server/services/storage';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware, emailOTP, openAPI } from 'better-auth/plugins';
import { db } from '../db/index';

export const auth = betterAuth({
	basePath: authBasePath,
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith('/callback/')) {
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
		})
	],
	socialProviders: {
		github: {
			clientId: env.OAUTH_CLIENT_ID as string,
			clientSecret: env.OAUTH_CLIENT_SECRET as string
		}
	}
});
