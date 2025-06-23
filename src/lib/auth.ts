import { env } from '$env/dynamic/private';
import { StorageService } from '$lib/server/storage';
import { toSnake } from '$lib/utils';
import { Log } from '@kitql/helpers';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware, emailOTP } from 'better-auth/plugins';
import { db } from './server/db/index';

const logger = new Log('Auth');

const storage = new StorageService();

export const auth = betterAuth({
	basePath: '/auth/api',
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith('/callback/')) {
				const user = ctx.context.newSession?.user;
				console.debug('user', user);
				if (user) {
					const buckets = await storage.listBuckets();
					const userBucket = buckets.find((bucket) => bucket.name === toSnake(user.name));

					if (!userBucket) {
						logger.info('Creating user bucket...');
						await storage.makeBucket(toSnake(user.name));
					}
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
