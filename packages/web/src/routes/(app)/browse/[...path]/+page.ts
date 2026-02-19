import { error } from "@sveltejs/kit";
import { api } from "$lib/api";
import type { BreadCrumb } from "$lib/utils";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, url, depends }) => {
	depends("app:files");

	const folders = params.path.split("/");

	const crumbs: BreadCrumb[] = [];
	const chain: string[] = [];

	crumbs.push({
		title: "My Drive",
		href: "/browse",
	});

	for (const folder of folders) {
		// Resolve display name via folder metadata
		const parent = chain.join("/");

		let title = folder;
		try {
			const { data: meta, error: metaError } = await api.GET(
				"/api/v1/storage/folder/{path}/meta",
				{
					params: {
						path: { path: folder },
						query: parent ? { parent } : undefined,
					},
					fetch,
					baseUrl: url.origin,
				},
			);

			if (metaError) {
				console.error("Failed to load folder metadata", metaError);
			} else {
				const metaData = meta?.data as Record<string, unknown> | undefined;
				if (metaData?.name) title = metaData.name as string;
			}

			crumbs.push({
				title,
				href: `/browse/${chain.join("/")}/${folder}`,
			});
		} catch {
			// Ignore errors and use folder ID as title
			crumbs.push({
				title,
				href: `/browse/${chain.join("/")}/${folder}`,
			});
		}
		chain.push(folder);
	}

	const { data, error: fetchError } = await api.GET(
		"/api/v1/storage/list/{path}",
		{
			params: {
				path: {
					path: chain.join("/"),
				},
			},
			fetch,
			baseUrl: url.origin,
		},
	);

	if (fetchError) {
		console.error("Failed to load files", fetchError);
		return error(500, "Failed to load files");
	}

	return {
		files: {
			data: data.data,
			err: undefined,
		},
		title: crumbs[crumbs.length - 1]?.title || folders[folders.length - 1],
		folders,
		crumbs,
	};
};
