import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { auth } from "$lib/server/auth";
import { getConfig, isAuthBypassed } from "$lib/server/config";

export const load = async ({ url, request }) => {
	const config = getConfig();

	// Escape hatch: /auth/sign-in?form always renders the form, so a broken IdP
	// or a locked-out admin can still reach email/passkey sign-in.
	const skip = url.searchParams.has("form");

	if (!skip) {
		if (isAuthBypassed()) {
			redirect(302, resolve("/"));
		}

		if (config.autoRedirectProvider) {
			const { url: providerUrl } = await auth.api.signInSocial({
				body: {
					provider: config.autoRedirectProvider,
					callbackURL: resolve("/"),
				},
				headers: request.headers,
			});
			if (providerUrl) {
				redirect(302, providerUrl);
			}
		}
	}

	return {
		authConfig: config.auth,
	};
};
