import { loadedOAuthProviders } from "$lib/server/auth";
import { getConfig } from "$lib/server/config";
import { Http } from "$lib/server/http";
import { listAuthProviders } from "$lib/server/openapi/v1/auth";
import { isOAuthSignInEnabled } from "$lib/server/services/app-settings";

export const GET = listAuthProviders.handler(async () => {
	try {
		const config = getConfig();
		const providers: {
			name: string;
			prettyName: string;
			type: "email" | "oauth";
			enabled: boolean;
		}[] = [];

		if (config.auth.enableEmailSignIn) {
			providers.push({
				name: "email",
				prettyName: "Email",
				type: "email" as const,
				enabled: true,
			});
		}

		// The loaded list, not the configured one: it includes providers added
		// in the admin UI, and excludes any saved since this process booted —
		// which have no endpoint to sign in through yet.
		if (await isOAuthSignInEnabled()) {
			for (const provider of loadedOAuthProviders) {
				providers.push({
					name: provider.name,
					prettyName: provider.prettyName,
					type: "oauth" as const,
					enabled: provider.enabled,
				});
			}
		}

		return Http.Ok(providers);
	} catch (error) {
		return Http.ServerError("Failed to list auth providers", error);
	}
});
