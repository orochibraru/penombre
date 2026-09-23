import { error } from "@sveltejs/kit";
import { api } from "#lib/api/index.js";
import { firstPageQuery } from "#lib/pagination.js";

export const load = async ({ fetch, url, depends, parent }) => {
	// Register dependency for targeted invalidation
	depends("app:files");

	const { preferences } = await parent();
	const res = await api.GET("/api/v1/storage/list", {
		params: { query: firstPageQuery(preferences) },
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
