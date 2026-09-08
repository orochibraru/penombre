import { error } from "@sveltejs/kit";
import { api } from "$lib/api";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, url, depends }) => {
	depends("app:files");

	if (!params.category) {
		return error(400, "Missing category parameter");
	}

	const { data, error: fetchError } = await api.GET(
		"/api/v1/storage/file/category/{category}",
		{
			params: { path: { category: params.category } },
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
