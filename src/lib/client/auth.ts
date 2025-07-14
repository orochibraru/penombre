import { emailOTPClient, genericOAuthClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

export const authBasePath = '/api/v1/auth';

export const authClient = createAuthClient({
	basePath: authBasePath,
	plugins: [emailOTPClient(), genericOAuthClient()]
});
