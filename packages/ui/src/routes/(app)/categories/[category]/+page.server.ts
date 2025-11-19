import { error } from "@sveltejs/kit";
import { getServerSideApi } from "$lib/api";

export const load = async ({ parent, params }) => {
	const { authCookie } = await parent();
	const { data, error: err } = await getServerSideApi(authCookie).GET(
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
		throw error(500, "Failed to load recent files");
	}

	return {
		category: params.category,
		files: {
			data,
			err,
		},
	};
};
