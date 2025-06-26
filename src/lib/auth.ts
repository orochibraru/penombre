import { env } from '$env/dynamic/private';
import { StorageService } from '$lib/server/services/storage';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware, emailOTP } from 'better-auth/plugins';
import { db } from './server/db/index';

const storage = new StorageService();

export const auth = betterAuth({
	basePath: '/auth/api',
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith('/callback/')) {
				const user = ctx.context.newSession?.user;
				if (user) {
					storage.setUser(user);
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
