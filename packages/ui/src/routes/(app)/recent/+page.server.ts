import { error } from "@sveltejs/kit";
import { getServerSideApi } from "$lib/api";

export const load = async ({ parent }) => {
	const { authCookie } = await parent();
	const { data, error: err } = await getServerSideApi(authCookie).GET(
		"/api/storage/objects/recent",
	);

	if (err) {
		throw error(500, "Failed to load recent files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
