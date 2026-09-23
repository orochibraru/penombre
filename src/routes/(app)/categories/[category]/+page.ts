import { error } from "@sveltejs/kit";
import { api } from "#lib/api/index.js";
import { firstPageQuery } from "#lib/pagination.js";

export const load = async ({ params, fetch, url, depends, parent }) => {
	depends("app:files");

	if (!params.category) {
		return error(400, "Missing category parameter");
	}

	const { preferences } = await parent();

	const { data, error: fetchError } = await api.GET(
		"/api/v1/storage/file/category/{category}",
		{
			params: {
				path: { category: params.category },
				query: firstPageQuery(preferences),
			},
			fetch,
			baseUrl: url.origin,
		},
	);

	if (fetchError) {
		return error(500, "Failed to load files");
	}

	return {
		category: params.category,
		files: {
			data: data?.data,
			err: undefined,
		},
	};
};
