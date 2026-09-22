import { error } from "@sveltejs/kit";
import { api } from "#lib/api/index.js";
import { firstPageQuery } from "#lib/pagination.js";

export const load = async ({ fetch, url, depends, parent }) => {
	depends("app:files");

	const { preferences } = await parent();
	const { data, error: fetchError } = await api.GET(
		"/api/v1/storage/file/starred",
		{
			params: { query: firstPageQuery(preferences) },
			fetch,
			baseUrl: url.origin,
		},
	);

	if (fetchError) {
		return error(500, "Failed to load files");
	}

	return {
		files: {
			data: data?.data,
			err: undefined,
		},
	};
};
