import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
	adminClient,
	emailOTPClient,
	magicLinkClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({
	plugins: [
		adminClient(),
		apiKeyClient(),
		passkeyClient(),
		emailOTPClient(),
		magicLinkClient(),
		// A password sign-in that needs a second factor resolves with
		// `twoFactorRedirect`, which lands here rather than at the app.
		twoFactorClient({
			onTwoFactorRedirect() {
				globalThis.location.href = "/auth/two-factor";
			},
		}),
	],
	basePath: "/api/v1/auth",
});
