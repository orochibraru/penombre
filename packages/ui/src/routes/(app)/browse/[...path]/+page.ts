import { browser, building } from "$app/environment";
import { getApiClient } from "$lib/api";
import { route } from "$lib/ROUTES";
import { type BreadCrumb, emptyFileApiResponse } from "$lib/utils";

export const load = async ({ params, fetch }) => {
	if (building) {
		return {
			files: emptyFileApiResponse,
			title: "Build Time",
			folders: [],
			crumbs: [],
		};
	}
	const folders = params.path.split("/");

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

	if (!browser) {
		return {
			files: {
				data: null,
				err: null,
			},
			title: folders[folders.length - 1],
			folders,
			crumbs,
		};
	}

	const api = getApiClient(fetch);

	const { data, error: err } = await api.GET("/api/storage/objects", {
		params: {
			query: {
				folder: params.path,
			},
		},
	});

	if (err) {
		throw new Error("Failed to load files");
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
