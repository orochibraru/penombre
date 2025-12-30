import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api-client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, fetch }) => {
	const client = getApiClient(fetch);

	const res = await client.storage.objects.category[":category"].$get({
		param: { category: params.category },
	});

	if (!res.ok) {
		console.error("Failed to load category files", res.status);
		return error(500, "Failed to load files");
	}

	const data = await res.json();

	return {
		category: params.category,
		files: {
			data,
			err: undefined,
		},
	};
};
