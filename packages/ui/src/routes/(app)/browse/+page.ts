import { building } from "$app/environment";
import { getApiClient } from "$lib/api";
import { emptyFileApiResponse } from "$lib/utils";

export const load = async () => {
	if (building) {
		return {
			files: emptyFileApiResponse,
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
