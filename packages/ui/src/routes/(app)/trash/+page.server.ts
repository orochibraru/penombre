import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api";

export const load = async ({ fetch }) => {
	const api = getApiClient(fetch);
	const { data, error: err } = await api.GET("/api/storage/objects/trash");

	if (err) {
		console.error(err);
		return error(500, "Failed to load files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
