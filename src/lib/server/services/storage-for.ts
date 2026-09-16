/**
 * The storage service a request acts through.
 *
 * Three places a file can live, and one function that decides between them:
 * the caller's own drive, a shared drive (`?drive=<id>`), or a mounted volume
 * (`?volume=<name>`). Every `/api/v1/storage/**` contract declares this as its
 * service factory, which is what makes an endpoint added later work in all
 * three without being told about any of them.
 *
 * A volume and a drive are the same thing to the storage layer — one tree,
 * owned by one account, everybody else acting on it as themselves — so both
 * are built the same way: the service carries the **owner**, whose id every
 * row has, and the session user as the **actor**, which is what the activity
 * log records.
 */

import { getVolume, type VolumeConfig } from "$lib/server/config";
import { DriveAccessError } from "$lib/server/errors";
import { DRIVE_HEADER, VOLUME_HEADER } from "$lib/storage-location";
import { driveStorage, drivesService } from "./drives";
import { loadSharedOwner } from "./library-scan";
import { StorageService } from "./storage";

/** Just enough of a request to answer "where". A page load has this shape too. */
interface LocatedEvent {
	url: URL;
	locals: App.Locals;
	request?: Request;
}

function parameter(
	event: LocatedEvent,
	query: string,
	header: string,
): string | undefined {
	return (
		event.url.searchParams.get(query) ??
		event.request?.headers.get(header) ??
		undefined
	);
}

export async function storageServiceFor(
	owner: NonNullable<App.Locals["user"]>,
	event: LocatedEvent,
): Promise<StorageService> {
	const sessionUser = event.locals.user;

	const driveId = parameter(event, "drive", DRIVE_HEADER);
	if (driveId) {
		if (!sessionUser) {
			throw new DriveAccessError(403, "Not signed in");
		}
		const { drive, role } = await drivesService.requireAccess(
			driveId,
			sessionUser.id,
		);
		return driveStorage(drive, role, sessionUser);
	}

	const volumeName = parameter(event, "volume", VOLUME_HEADER);
	if (volumeName) {
		const volume = getVolume(volumeName);
		if (!volume) {
			// The same answer a drive the caller cannot open gets: a name that
			// resolves to nothing is nothing.
			throw new DriveAccessError(404, "No such volume");
		}
		return volumeStorage(volume, sessionUser ?? owner);
	}

	return new StorageService(owner);
}

/**
 * A service bound to a mounted volume.
 *
 * Its rows belong to the shared owner — the first account ever created —
 * because the mount is one tree that everybody browses: letting each account
 * own what it happened to scan would file the same file twice.
 */
export async function volumeStorage(
	volume: VolumeConfig,
	actor: NonNullable<App.Locals["user"]>,
): Promise<StorageService> {
	const owner = (await loadSharedOwner()) ?? actor;
	const service = new StorageService(owner, volume, actor);
	await service.ensureUserDirectory();
	return service;
}
