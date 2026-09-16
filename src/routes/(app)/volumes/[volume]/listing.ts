/**
 * The load behind every volume listing: the mount root, any folder in it, and
 * its trash.
 *
 * Server-side and straight through `StorageService`, like a drive's — the
 * folder names are one database read each here, against one HTTP request per
 * breadcrumb through the API.
 */

import { error } from "@sveltejs/kit";
import { getVolume } from "$lib/server/config";
import { isStorageUnavailable } from "$lib/server/errors";
import type { ObjectList } from "$lib/server/schema";
import { scanOnVisit, volumeScanKey } from "$lib/server/services/library-scan";
import { volumeStorage } from "$lib/server/services/storage-for";
import type { BreadCrumb } from "$lib/utils";

export interface VolumeListing {
	volume: { name: string; label: string; readOnly: boolean };
	files: { data: ObjectList; err: undefined };
	crumbs: BreadCrumb[];
	title: string;
	/** A reconciliation pass is walking the mount right now. */
	scanning: boolean;
}

export async function loadVolumeListing(
	name: string,
	path: string | undefined,
	locals: App.Locals,
	options: { trash?: boolean } = {},
): Promise<VolumeListing> {
	const volume = getVolume(name);
	if (!volume) {
		return error(404, "No such volume");
	}
	if (!locals.user) {
		return error(401);
	}

	try {
		const service = await volumeStorage(volume, locals.user);

		// A mounted directory is written from outside the app, so the rows only
		// match reality if we look — but not while the request waits.
		const scanning = scanOnVisit(volumeScanKey(volume.name), () =>
			service.scanStorage().then(() => undefined),
		);

		const crumbs: BreadCrumb[] = [
			{ title: volume.label, href: `/volumes/${volume.name}` },
		];
		const chain: string[] = [];
		for (const segment of path ? path.split("/") : []) {
			chain.push(segment);
			const meta = await service.getFolderMeta(segment);
			crumbs.push({
				title: meta?.name ?? segment,
				href: `/volumes/${volume.name}/${chain.join("/")}`,
			});
		}

		return {
			volume: {
				name: volume.name,
				label: volume.label,
				readOnly: volume.readOnly,
			},
			files: {
				data: options.trash
					? await service.listTrashFiles()
					: await service.listFiles(path || undefined),
				err: undefined,
			},
			crumbs,
			title: crumbs[crumbs.length - 1]?.title ?? volume.label,
			scanning,
		};
	} catch (cause) {
		// A mount the container has no rights on: say so, rather than the
		// generic 500 that tells the person to contact the admin they are.
		if (isStorageUnavailable(cause)) {
			return error(503, `Cannot read the files mounted at ${volume.path}`);
		}
		throw cause;
	}
}
