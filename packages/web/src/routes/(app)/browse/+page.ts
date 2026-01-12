import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api-client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, depends }) => {
	// Register dependency for targeted invalidation
	depends("app:files");

	const client = getApiClient(fetch);

	const res = await client.storage.objects.$get({ query: {} });
	if (!res.ok) {
		console.error("Failed to load files", res.status);
		return error(500, "Failed to load files");
	}

	const data = await res.json();

	return {
		files: {
			data,
			err: undefined,
		},
	};
};
