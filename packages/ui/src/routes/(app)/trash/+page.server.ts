import { error } from "@sveltejs/kit";
import { getServerSideApi } from "$lib/api";

export const load = async ({ parent }) => {
	const { authCookie } = await parent();
	const { data, error: err } = await getServerSideApi(authCookie).GET(
		"/api/storage/objects/trash",
	);

	if (err) {
		throw error(500, "Failed to load trash files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
