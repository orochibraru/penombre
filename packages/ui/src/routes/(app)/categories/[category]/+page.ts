import { getApiClient } from "$lib/api";

export const load = async ({ params }: { params: { category: string } }) => {
	const { data, error: err } = await getApiClient().GET(
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
		throw new Error("Failed to load recent files");
	}

	return {
		category: params.category,
		files: {
			data,
			err,
		},
	};
};
