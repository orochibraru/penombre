import { getApiClient } from "$lib/api";

export const load = async () => {
	const { data, error: err } = await getApiClient().GET(
		"/api/storage/objects/recent",
	);

	if (err) {
		throw new Error("Failed to load recent files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
