import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api";

export const load = async ({ fetch, request }) => {
	const api = getApiClient({ fetch, url: new URL(request.url) });

	const { data, error: err } = await api.GET("/api/storage/objects");
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
