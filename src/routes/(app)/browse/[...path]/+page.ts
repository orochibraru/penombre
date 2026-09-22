import { error } from "@sveltejs/kit";
import { api } from "#lib/api/index.js";
import { firstPageQuery } from "#lib/pagination.js";
import * as m from "#lib/paraglide/messages.js";
import type { BreadCrumb } from "#lib/utils.js";

export const load = async ({ params, fetch, url, depends, parent }) => {
	depends("app:files");

	const folders = params.path.split("/");
	const chain = folders.map((_, i) => folders.slice(0, i + 1).join("/"));

	// The listing endpoint returns one name per breadcrumb segment alongside
	// the listing itself, so a deep path costs one request rather than one
	// per level.
	const { preferences } = await parent();
	const listing = await api.GET("/api/v1/storage/list/{path}", {
		params: {
			path: { path: chain[chain.length - 1] ?? "" },
			query: firstPageQuery(preferences),
		},
		fetch,
		baseUrl: url.origin,
	});

	if (listing.error) {
		return error(500, "Failed to load files");
	}

	const ancestorNames = listing.data.data?.ancestorNames ?? [];
	const crumbs: BreadCrumb[] = [
		{ title: m.nav_my_drive(), href: "/browse" },
		...folders.map(
			(folder, i): BreadCrumb => ({
				title: ancestorNames[i] ?? folder,
				href: `/browse/${chain[i]}`,
			}),
		),
	];

	return {
		files: {
			data: listing.data.data,
			err: undefined,
		},
		title: crumbs[crumbs.length - 1]?.title || folders[folders.length - 1],
		folders,
		crumbs,
	};
};
