/**
 * The load behind both drive listings: the drive root and any folder in it.
 *
 * Server-side and straight through `StorageService`, rather than the HTTP API
 * the personal drive's loads use: the membership check and the folder names
 * are two database reads here, against one request per breadcrumb there.
 */

import { error, type NumericRange } from "@sveltejs/kit";
import { isSimpleMode } from "$lib/server/config";
import { DriveAccessError, isStorageUnavailable } from "$lib/server/errors";
import type { ObjectList } from "$lib/server/schema";
import {
	type DriveRole,
	driveStorage,
	drivesService,
} from "$lib/server/services/drives";
import type { BreadCrumb } from "$lib/utils";

export interface DriveListing {
	drive: { id: string; name: string; role: DriveRole; readOnly: boolean };
	files: { data: ObjectList; err: undefined };
	crumbs: BreadCrumb[];
	title: string;
}

export async function loadDriveListing(
	driveId: string,
	path: string | undefined,
	locals: App.Locals,
): Promise<DriveListing> {
	// Simple mode shares one drive with everyone already. See `/drives/shared`.
	if (isSimpleMode()) {
		return error(404);
	}
	if (!locals.user) {
		return error(401);
	}

	const access = await drivesService
		.requireAccess(driveId, locals.user.id)
		.catch((cause: unknown) => {
			if (cause instanceof DriveAccessError) {
				return error(cause.status as NumericRange<400, 599>, cause.message);
			}
			throw cause;
		});

	const { drive, role } = access;
	const service = await driveStorage(drive, role, locals.user).catch(
		(cause: unknown) => {
			if (isStorageUnavailable(cause)) {
				return error(503, "Cannot reach this drive's files on disk");
			}
			throw cause;
		},
	);

	const segments = path ? path.split("/") : [];
	const crumbs: BreadCrumb[] = [
		{ title: drive.name, href: `/drives/${drive.id}` },
	];
	const chain: string[] = [];
	for (const segment of segments) {
		chain.push(segment);
		const meta = await service.getFolderMeta(segment);
		crumbs.push({
			title: meta?.name ?? segment,
			href: `/drives/${drive.id}/${chain.join("/")}`,
		});
	}

	return {
		drive: {
			id: drive.id,
			name: drive.name,
			role,
			readOnly: role === "viewer",
		},
		files: { data: await service.listFiles(path || undefined), err: undefined },
		crumbs,
		title: crumbs[crumbs.length - 1]?.title ?? drive.name,
	};
}
