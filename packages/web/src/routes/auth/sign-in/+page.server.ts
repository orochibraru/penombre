import { getOpendriveConfig } from "$lib/server/config";

export const load = () => {
	const config = getOpendriveConfig();
	return {
		authConfig: config.auth,
	};
};
