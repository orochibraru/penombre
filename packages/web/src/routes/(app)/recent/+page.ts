import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api-client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, depends }) => {
	depends("app:files");

	const client = getApiClient(fetch);

	const res = await client.storage.objects.recent.$get();
	if (!res.ok) {
		console.error("Failed to load recent files", res.status);
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
