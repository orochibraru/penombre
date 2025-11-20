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
