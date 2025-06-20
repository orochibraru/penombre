import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte'; // make sure to import from better-auth/svelte

export const authClient = createAuthClient({
	basePath: '/auth/api',
	plugins: [emailOTPClient()]
});
