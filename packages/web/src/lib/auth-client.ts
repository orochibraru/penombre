import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { adminClient, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
	plugins: [
		genericOAuthClient(),
		adminClient(),
		apiKeyClient(),
		passkeyClient(),
	],
	basePath: "/api/v1/auth",
});
