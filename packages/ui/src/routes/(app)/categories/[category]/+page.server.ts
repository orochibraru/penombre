import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api";

export const load = async ({ params, fetch }) => {
	const { data, error: err } = await getApiClient(fetch).GET(
		"/api/storage/objects/category/{category}",
		{
			params: {
				path: {
					category: params.category,
				},
			},
		},
	);

	if (err) {
		console.error(err);
		return error(500, "Failed to load files");
	}

	return {
		category: params.category,
		files: {
			data,
			err,
		},
	};
};
