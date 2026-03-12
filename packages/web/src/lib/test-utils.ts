import type { PenombreConfig } from "$lib/server/config";

export function extractFirstOidcProvider(
	providers: PenombreConfig["auth"]["oauthProviders"],
) {
	const firstProvider = providers[0];

	if (!firstProvider) {
		throw new Error("No OAuth providers found in config");
	}

	return firstProvider;
}
