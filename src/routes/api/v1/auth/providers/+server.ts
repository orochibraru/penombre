import { loadedOAuthProviders } from "#lib/server/auth/index.js";
import { Http } from "#lib/server/http.js";
import { listAuthProviders } from "#lib/server/openapi/v1/auth.js";
import {
	isEmailSignInEnabled,
	isOAuthSignInEnabled,
} from "#lib/server/services/app-settings.js";

export const GET = listAuthProviders.handler(async () => {
	try {
		const providers: {
			name: string;
			prettyName: string;
			type: "email" | "oauth";
			enabled: boolean;
		}[] = [];

		if (await isEmailSignInEnabled()) {
			providers.push({
				name: "email",
				prettyName: "Email",
				type: "email" as const,
				enabled: true,
			});
		}

		if (await isOAuthSignInEnabled()) {
			for (const provider of await loadedOAuthProviders()) {
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
