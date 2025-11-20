import { browser } from "$app/environment";
import { getApiClient } from "$lib/api";

export const load = async () => {
	if (!browser) {
		return {
			files: {
				data: null,
				err: null,
			},
		};
	}

	const api = getApiClient();

	const { data, error: err } = await api.GET("/api/storage/objects");
	if (err) {
		console.error(err);
		throw new Error("Failed to load files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
