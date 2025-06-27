import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

export const apiBasePath = '/api/v1/auth';

export const authClient = createAuthClient({
	basePath: apiBasePath,
	plugins: [emailOTPClient()]
});
