import { error } from "@sveltejs/kit";
import { getApiClient } from "$lib/api-client";
import { route } from "$lib/ROUTES";
import type { BreadCrumb } from "$lib/utils";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, depends }) => {
	depends("app:files");

	const folders = params.path.split("/");

	const crumbs: BreadCrumb[] = [];
	const chain: string[] = [];

	crumbs.push({
		title: "My Drive",
		href: route("/browse"),
	});

	for (const folder of folders) {
		// Resolve display name via folder metadata
		const parent = chain.join("/");
		let title = folder;
		try {
			const resMeta = await fetch(
				`/api/storage/folders/folder/${encodeURIComponent(folder)}/meta${
					parent ? `?parent=${encodeURIComponent(parent)}` : ""
				}`,
			);
			if (resMeta.ok) {
				const meta = await resMeta.json();
				if (meta?.name) title = meta.name as string;
			}
		} catch {}

		crumbs.push({
			title,
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
		title: crumbs[crumbs.length - 1]?.title || folders[folders.length - 1],
		folders,
		crumbs,
	};
};
