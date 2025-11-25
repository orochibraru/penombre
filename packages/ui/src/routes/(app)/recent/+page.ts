import { building } from "$app/environment";
import { getApiClient } from "$lib/api";
import { emptyFileApiResponse } from "$lib/utils";

export const load = async ({ fetch }) => {
	if (building) {
		return {
			files: emptyFileApiResponse,
		};
	}

	const api = getApiClient(fetch);
	const { data, error: err } = await api.GET("/api/storage/objects/recent");

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
