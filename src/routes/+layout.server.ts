import { getConfig, isAuthBypassed } from "#lib/server/config.js";

export const load = () => {
	const config = getConfig();
	// No sign-in means no account to manage — the UI drops user/profile/admin.
	return { config, authBypassed: isAuthBypassed() };
};
