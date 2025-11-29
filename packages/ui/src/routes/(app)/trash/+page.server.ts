import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api";

export const load = async ({ fetch, request }) => {
	const api = getApiClient({
		fetch,
		url: new URL(request.url),
		cookie: request.headers.get("cookie") || undefined,
	});
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
