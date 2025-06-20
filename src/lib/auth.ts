import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { db } from './server/db/index';

export const auth = betterAuth({
	basePath: '/auth/api',
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: false
	},
	plugins: [
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
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
