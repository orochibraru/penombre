import { error } from "@sveltejs/kit";
import { getServerSideApi } from "$lib/api";

export const load = async ({ parent }) => {
	const { authCookie } = await parent();

	const api = getServerSideApi(authCookie);

	const { data, error: err } = await api.GET("/api/storage/objects");
	if (err) {
		console.error(err);
		throw error(500, "Failed to load files");
	}

	return {
		files: {
			data,
			err,
		},
	};
};
