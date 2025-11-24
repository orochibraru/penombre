import { building } from "$app/environment";
import { getApiClient } from "$lib/api";
import { emptyFileApiResponse } from "$lib/utils";

export const load = async () => {
	if (building) {
		return {
			files: emptyFileApiResponse,
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
