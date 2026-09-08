import { getConfig } from "$lib/server/config";

export const load = () => {
	const config = getConfig();
	return {
		authConfig: config.auth,
	};
};
