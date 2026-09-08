import { getPenombreConfig } from "$lib/server/config";

export const load = () => {
	const config = getPenombreConfig();
	return {
		authConfig: config.auth,
	};
};
