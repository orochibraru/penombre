import { getOpendriveConfig } from "$lib/server/config";
import { Http } from "$lib/server/http";
import { listAuthProviders } from "$lib/server/openapi/v1/auth";

export const GET = listAuthProviders.handler(async () => {
	try {
		const config = getOpendriveConfig();
		const providers = [];

		if (config.auth.enableEmailSignIn) {
			providers.push({
				name: "email",
				prettyName: "Email",
				type: "email" as const,
				enabled: true,
			});
		}

		if (config.auth.enableOAuthSignIn) {
			for (const provider of config.auth.oauthProviders) {
				providers.push({
					name: provider.name,
					prettyName: provider.prettyName ?? provider.name,
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
