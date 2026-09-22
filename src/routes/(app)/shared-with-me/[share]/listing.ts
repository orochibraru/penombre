/**
 * The load behind a share's listings: its root and any folder inside it.
 *
 * Paths stay the owner's full paths, as everywhere else, so every action in
 * the listing addresses rows the way it would in the owner's own drive. A path
 * outside what was shared is sent back to the share's root.
 */

import { error, redirect } from "@sveltejs/kit";
import { firstPageQuery } from "#lib/pagination.js";
import { isSimpleMode } from "#lib/server/config.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";
import {
	type ListingPage,
	pageOptions,
} from "#lib/server/services/storage/listings.js";
import { resolveShare } from "#lib/server/services/storage-for.js";
import { type BreadCrumb, listingHref } from "#lib/utils.js";

export interface ShareListing {
	share: {
		id: string;
		name: string;
		ownerName: string;
		permission: "read" | "write" | "admin";
		readOnly: boolean;
		root: string;
	};
	files: { data: ListingPage; err: undefined };
	crumbs: BreadCrumb[];
	title: string;
}

export async function loadShareListing(
	shareId: string,
	path: string | undefined,
	locals: App.Locals,
): Promise<ShareListing> {
	if (isSimpleMode()) {
		return error(404);
	}
	if (!locals.user) {
		return error(401);
	}

	const share = await resolveShare(shareId, locals.user).catch(
		(cause: unknown) => {
			if (cause instanceof DriveAccessError) {
				return error(cause.status, cause.message);
			}
			throw cause;
		},
	);

	const location = { share: shareId };
	const crumbHref = (folder: string): BreadCrumb["href"] =>
		folder
			? `/shared-with-me/${shareId}/${folder}`
			: `/shared-with-me/${shareId}`;
	const current = path ?? "";
	const inside =
		current === share.root ||
		(share.root !== "" && current.startsWith(`${share.root}/`));
	if (!inside) {
		return redirect(307, listingHref(share.root, location));
	}

	const crumbs: BreadCrumb[] = [
		{ title: share.name, href: crumbHref(share.root) },
	];
	if (share.resourceType === "folder") {
		const below = current.slice(share.root.length).split("/").filter(Boolean);
		let chain = share.root;
		for (const segment of below) {
			chain = `${chain}/${segment}`;
			const meta = await share.service.getFolderMeta(chain);
			crumbs.push({
				title: meta?.name ?? segment,
				href: crumbHref(chain),
			});
		}
	}

	return {
		share: {
			id: shareId,
			name: share.name,
			ownerName: share.ownerName,
			permission: share.permission,
			readOnly: share.service.readOnly,
			root: share.root,
		},
		files: {
			data: await share.service.listFolderPage(
				current || undefined,
				pageOptions(firstPageQuery(await getUserPreferences(locals.user.id))),
			),
			err: undefined,
		},
		crumbs,
		title: crumbs[crumbs.length - 1]?.title ?? share.name,
	};
}
