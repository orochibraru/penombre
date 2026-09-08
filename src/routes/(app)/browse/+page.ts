import { error } from "@sveltejs/kit";
import { api } from "$lib/api";

export const load = async ({ fetch, url, depends }) => {
	// Register dependency for targeted invalidation
	depends("app:files");

	const res = await api.GET("/api/v1/storage/list", {
		fetch,
		baseUrl: url.origin,
	});

	if (res.error) {
		return error(500, "Failed to load files");
	}

	return {
		files: {
			data: res.data.data,
			err: undefined,
		},
	};
};
