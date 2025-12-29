import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api-client";

export const load = async ({ fetch }) => {
	const client = getApiClient(fetch);

	const { data, error: err } = await client.storage.objects.$get();
	if (err) {
		console.error(err);
		return error(500, "Failed to load files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
