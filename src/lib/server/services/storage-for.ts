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

import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { getVolume, type VolumeConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { drives, files, folders, user } from "#lib/server/db/schema.js";
import { DriveAccessError } from "#lib/server/errors.js";
import {
	DRIVE_HEADER,
	SHARE_HEADER,
	VOLUME_HEADER,
} from "#lib/storage-location.js";
import { driveStorage, drivesService, driveVolume } from "./drives";
import { loadSharedOwner } from "./library-scan";
import { SharingService } from "./sharings";
import { StorageService } from "./storage";
import type { StorageScope } from "./storage/context";

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

	const shareId = parameter(event, "share", SHARE_HEADER);
	if (shareId) {
		if (!sessionUser) {
			throw new DriveAccessError(403, "Not signed in");
		}
		return sharedStorage(shareId, sessionUser);
	}

	return new StorageService(owner);
}

const sharings = new SharingService();

export interface ResolvedShare {
	service: StorageService;
	resourceType: "file" | "folder";
	name: string;
	ownerName: string;
	permission: "read" | "write" | "admin";
	/**
	 * The folder a listing of this share opens on: the shared folder itself,
	 * or a shared file's parent ("" at the owner's root).
	 */
	root: string;
}

/**
 * The owner's tree, narrowed to what was shared with `recipient`.
 *
 * Built as the owner — whose rows these are — on whichever volume the item
 * lives, with the scope doing the narrowing inside every query. A "read"
 * share is read-only; anything more may work inside the shared folder.
 */
export async function resolveShare(
	sharedWithId: string,
	recipient: User,
): Promise<ResolvedShare> {
	const notFound = new DriveAccessError(404, "No such share");
	const access = await sharings.resolveAccess(recipient.id, sharedWithId);
	if (!access) {
		throw notFound;
	}
	const db = getDb();

	let scope: StorageScope;
	let item: { name: string; volumeId: string | null; root: string };
	if (access.resourceType === "folder") {
		const [row] = await db
			.select()
			.from(folders)
			.where(
				and(eq(folders.id, access.resourceId), eq(folders.isTrashed, false)),
			);
		if (!row) {
			throw notFound;
		}
		scope = { kind: "folder", path: row.path };
		item = { name: row.name, volumeId: row.volumeId, root: row.path };
	} else {
		const [row] = await db
			.select()
			.from(files)
			.where(and(eq(files.id, access.resourceId), eq(files.isTrashed, false)));
		if (!row) {
			throw notFound;
		}
		scope = { kind: "file", fileId: row.id, folderId: row.folderId };
		const root = row.path.includes("/")
			? row.path.slice(0, row.path.lastIndexOf("/"))
			: "";
		item = { name: row.name, volumeId: row.volumeId, root };
	}

	const [owner] = await db
		.select()
		.from(user)
		.where(eq(user.id, access.ownerId));
	const volume = await volumeById(item.volumeId);
	if (!owner || volume === null) {
		throw notFound;
	}
	return {
		service: new StorageService(owner as User, volume, recipient, {
			scope,
			readOnly: access.permission === "read",
		}),
		resourceType: access.resourceType,
		name: item.name,
		ownerName: owner.name,
		permission: access.permission,
		root: item.root,
	};
}

export async function sharedStorage(
	sharedWithId: string,
	recipient: User,
): Promise<StorageService> {
	return (await resolveShare(sharedWithId, recipient)).service;
}

/** A row's `volume_id` back to its volume: undefined is the personal drive. */
export async function volumeById(
	volumeId: string | null,
): Promise<VolumeConfig | undefined | null> {
	if (volumeId === null) {
		return undefined;
	}
	if (volumeId.startsWith("drive:")) {
		const [drive] = await getDb()
			.select()
			.from(drives)
			.where(eq(drives.id, volumeId.slice("drive:".length)));
		return drive ? driveVolume(drive, "editor") : null;
	}
	return getVolume(volumeId) ?? null;
}

/**
 * A service for the tree a row lives in, from the row's owner and volume —
 * for background work that has no request. Undefined when the owner or the
 * volume is gone (a volume removed from the environment, a deleted drive).
 */
export async function serviceForRoot(root: {
	ownerId: string;
	volumeId: string | null;
}): Promise<StorageService | undefined> {
	const [owner] = await getDb()
		.select()
		.from(user)
		.where(eq(user.id, root.ownerId));
	const volume = await volumeById(root.volumeId);
	if (!owner || volume === null) {
		return undefined;
	}
	return new StorageService(owner as User, volume);
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
