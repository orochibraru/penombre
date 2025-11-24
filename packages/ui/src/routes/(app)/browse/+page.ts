import { getApiClient } from "$lib/api";

export const load = async () => {
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
