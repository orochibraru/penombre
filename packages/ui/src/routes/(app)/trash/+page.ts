import { getApiClient } from "$lib/api";

export const load = async () => {
	const { data, error: err } = await getApiClient().GET(
		"/api/storage/objects/trash",
	);

	if (err) {
		throw new Error("Failed to load trash files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
