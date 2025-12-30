import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api-client";
import { route } from "$lib/ROUTES";
import type { BreadCrumb } from "$lib/utils";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, fetch }) => {
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

	const client = getApiClient(fetch);

	const res = await client.storage.objects.$get({
		query: { folder: params.path },
	});

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
		title: folders[folders.length - 1],
		folders,
		crumbs,
	};
};
