import { building } from "$app/environment";
import { getApiClient } from "$lib/api";
import { emptyFileApiResponse } from "$lib/utils";

export const load = async ({ params }: { params: { category: string } }) => {
	if (building) {
		return {
			category: params.category,
			files: emptyFileApiResponse,
		};
	}
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
