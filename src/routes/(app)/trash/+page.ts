import { error } from "@sveltejs/kit";
import { api } from "$lib/api";

export const load = async ({ fetch, url, depends }) => {
	depends("app:files", "app:trash");

	const { data, error: fetchError } = await api.GET(
		"/api/v1/storage/file/trash",
		{
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
