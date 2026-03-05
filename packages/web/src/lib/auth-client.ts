import { apiKeyClient } from "@better-auth/api-key/client";
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { adminClient, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
	plugins: [
		genericOAuthClient(),
		adminClient(),
		dashClient(),
		apiKeyClient(),
		sentinelClient({
			autoSolveChallenge: true, // Automatically solve PoW challenges
		}),
	],
	basePath: "/api/v1/auth",
});
