import { error } from "@sveltejs/kit";
import { getServerSideApi } from "$lib/api";
import { route } from "$lib/ROUTES";
import type { BreadCrumb } from "$lib/utils";

export const load = async ({ params, parent }) => {
	const { authCookie } = await parent();
	const folders = params.path.split("/");

	const api = getServerSideApi(authCookie);

	const crumbs: BreadCrumb[] = [];
	const chain: string[] = [];

	crumbs.push({
		title: "My Drive",
		href: route("/browse"),
	});

	for (const folder of folders) {
		crumbs.push({
			title: folder,
			href: route("/browse/[...path]", {
				path: [...chain, folder],
			}),
		});
		chain.push(folder);
	}

	const { data, error: err } = await api.GET("/api/storage/objects", {
		params: {
			query: {
				folder: params.path,
			},
		},
	});

	if (err) {
		throw error(500, "Failed to load files");
	}

	return {
		files: {
			data,
			err,
		},
		title: folders[folders.length - 1],
		folders,
		crumbs,
	};
};
