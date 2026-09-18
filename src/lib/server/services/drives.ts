/**
 * Shared drives: a drive that belongs to a group instead of a person.
 *
 * A drive is a volume the app owns. Its files and folders are ordinary rows
 * stamped with `volume_id = drive:<id>` and owned by the creator, so every
 * storage query, cache key and mutation already scopes to it — the whole
 * feature is a `VolumeConfig` built at request time plus a membership check.
 * Nothing in `services/storage` knows drives exist.
 *
 * Two identities are in play and must not be confused: the drive's **owner**,
 * whose id every row carries, and the **member** making the request, who is
 * who the activity log has to name.
 */

import { rm } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, inArray, or } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { getStoragePath, type VolumeConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import {
	type Drive,
	driveMembers,
	drives,
	files,
	folders,
	user,
} from "#lib/server/db/schema.js";
import { DriveAccessError } from "#lib/server/errors.js";
import { StorageService } from "#lib/server/services/storage/index.js";

const logger = new Logger("DrivesService");

export type DriveRole = "manager" | "editor" | "viewer";

/** What a member may do. Managers also manage the drive itself. */
export const DRIVE_ROLES: DriveRole[] = ["manager", "editor", "viewer"];

export interface DriveSummary {
	id: string;
	name: string;
	/** The caller's role. The owner is always a manager. */
	role: DriveRole;
	owner: boolean;
}

export interface DriveMemberDto {
	/** The member's user id — the owner has no `drive_members` row to address. */
	userId: string;
	name: string;
	email: string;
	image: string | null;
	role: DriveRole;
	owner: boolean;
}

/** Access granted to one person on one drive. */
export interface DriveAccess {
	drive: Drive;
	role: DriveRole;
}

/**
 * The volume id a drive's rows carry.
 *
 * Colon-prefixed so it can never collide with an env-declared volume, whose
 * name is a lowercased `VOLUME_<NAME>_PATH` and so only ever `[a-z0-9-]`.
 */
export function driveVolumeId(driveId: string): string {
	return `drive:${driveId}`;
}

/** Where a drive's bytes live: its own root under `STORAGE_PATH`. */
export function drivePath(driveId: string): string {
	return join(getStoragePath(), "drives", driveId);
}

/** A drive as the storage layer sees it: a volume, read-only for a viewer. */
export function driveVolume(drive: Drive, role: DriveRole): VolumeConfig {
	return {
		name: driveVolumeId(drive.id),
		label: drive.name,
		path: drivePath(drive.id),
		readOnly: role === "viewer",
	};
}

/**
 * Let a refusal reach `defineRoute`'s error mapping instead of being swallowed
 * by a handler's catch and answered as a 500. Call it first in every catch
 * around a drives-service call.
 */
export function rethrowRefusal(error: unknown): void {
	if (error instanceof DriveAccessError) {
		throw error;
	}
}

export class DrivesService {
	// A getter rather than a field so a test can shadow it with
	// `Object.defineProperty` instead of mocking the whole db module.
	private get db() {
		return getDb();
	}

	/** Every drive this user owns or belongs to, with their role on each. */
	async listForUser(userId: string): Promise<DriveSummary[]> {
		const rows = await this.db
			.select({
				id: drives.id,
				name: drives.name,
				ownerId: drives.ownerId,
				role: driveMembers.role,
			})
			.from(drives)
			.leftJoin(
				driveMembers,
				and(
					eq(driveMembers.driveId, drives.id),
					eq(driveMembers.userId, userId),
				),
			)
			.where(or(eq(drives.ownerId, userId), eq(driveMembers.userId, userId)));

		return rows
			.map((row) => ({
				id: row.id,
				name: row.name,
				owner: row.ownerId === userId,
				role: (row.ownerId === userId
					? "manager"
					: (row.role ?? "viewer")) as DriveRole,
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	/** The drive and the caller's role on it, or null if they have neither. */
	async access(driveId: string, userId: string): Promise<DriveAccess | null> {
		const [drive] = await this.db
			.select()
			.from(drives)
			.where(eq(drives.id, driveId));
		if (!drive) {
			return null;
		}
		if (drive.ownerId === userId) {
			return { drive, role: "manager" };
		}
		const [member] = await this.db
			.select({ role: driveMembers.role })
			.from(driveMembers)
			.where(
				and(eq(driveMembers.driveId, driveId), eq(driveMembers.userId, userId)),
			);
		return member ? { drive, role: member.role as DriveRole } : null;
	}

	/**
	 * Access, or the reason there is none.
	 *
	 * A drive the caller is not a member of is reported as missing: a guessed
	 * id must not tell them the drive exists.
	 */
	async requireAccess(driveId: string, userId: string): Promise<DriveAccess> {
		const access = await this.access(driveId, userId);
		if (!access) {
			throw new DriveAccessError(404, "No such drive");
		}
		return access;
	}

	/** Access, refused unless the caller manages the drive. */
	async requireManager(driveId: string, userId: string): Promise<DriveAccess> {
		const access = await this.requireAccess(driveId, userId);
		if (access.role !== "manager") {
			throw new DriveAccessError(403, "Only a manager may do that");
		}
		return access;
	}

	async create(ownerId: string, name: string): Promise<DriveSummary> {
		const id = crypto.randomUUID();
		await this.db.insert(drives).values({ id, name, ownerId });
		logger.info(`Created shared drive ${id} for ${ownerId}`);
		return { id, name, role: "manager", owner: true };
	}

	async rename(driveId: string, userId: string, name: string): Promise<void> {
		await this.requireManager(driveId, userId);
		await this.db.update(drives).set({ name }).where(eq(drives.id, driveId));
	}

	/**
	 * Delete a drive and everything in it. Owner only — a manager may hand out
	 * access but not destroy someone else's drive.
	 *
	 * Rows first, then bytes: the reverse of emptying the trash, because
	 * nothing scans a drive, so an orphaned directory is dead weight rather
	 * than a file that reappears. The rows have no foreign key to `drives`,
	 * so the cascade does not reach them.
	 */
	async remove(driveId: string, userId: string): Promise<void> {
		const { drive } = await this.requireAccess(driveId, userId);
		if (drive.ownerId !== userId) {
			throw new DriveAccessError(403, "Only the owner may delete a drive");
		}
		const volumeId = driveVolumeId(driveId);
		await this.db.delete(files).where(eq(files.volumeId, volumeId));
		await this.db.delete(folders).where(eq(folders.volumeId, volumeId));
		await this.db.delete(drives).where(eq(drives.id, driveId));
		await rm(drivePath(driveId), { recursive: true, force: true }).catch(
			(error) => {
				logger.warn(`Could not remove drive directory ${driveId}`, error);
			},
		);
	}

	/** Everyone on the drive, the owner first. */
	async members(driveId: string, userId: string): Promise<DriveMemberDto[]> {
		const { drive } = await this.requireAccess(driveId, userId);

		const rows = await this.db
			.select({
				userId: driveMembers.userId,
				role: driveMembers.role,
				name: user.name,
				email: user.email,
				image: user.image,
			})
			.from(driveMembers)
			.innerJoin(user, eq(user.id, driveMembers.userId))
			.where(eq(driveMembers.driveId, driveId));

		const [owner] = await this.db
			.select({
				userId: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			})
			.from(user)
			.where(eq(user.id, drive.ownerId));

		return [
			...(owner
				? [{ ...owner, role: "manager" as DriveRole, owner: true }]
				: []),
			...rows.map((row) => ({
				userId: row.userId,
				name: row.name,
				email: row.email,
				image: row.image,
				role: row.role as DriveRole,
				owner: false,
			})),
		];
	}

	/**
	 * Add people, or change the role of people already on the drive.
	 *
	 * Returns the ids that were newly granted access, so only they are told —
	 * the same rule `SharingService.share` follows.
	 */
	async addMembers(
		driveId: string,
		actingUserId: string,
		userIds: string[],
		role: DriveRole,
	): Promise<string[]> {
		const { drive } = await this.requireManager(driveId, actingUserId);

		// The owner is a manager by virtue of owning it; a row for them would
		// be a second, contradictable answer to the same question.
		const candidates = await this.db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.id, userIds));
		const targets = candidates
			.map((row) => row.id)
			.filter((id) => id !== drive.ownerId);
		if (targets.length === 0) {
			return [];
		}

		const existing = await this.db
			.select({ userId: driveMembers.userId })
			.from(driveMembers)
			.where(
				and(
					eq(driveMembers.driveId, driveId),
					inArray(driveMembers.userId, targets),
				),
			);
		const already = new Set(existing.map((row) => row.userId));

		const added = targets.filter((id) => !already.has(id));
		if (added.length > 0) {
			await this.db.insert(driveMembers).values(
				added.map((id) => ({
					id: crypto.randomUUID(),
					driveId,
					userId: id,
					role,
				})),
			);
		}
		if (already.size > 0) {
			await this.db
				.update(driveMembers)
				.set({ role })
				.where(
					and(
						eq(driveMembers.driveId, driveId),
						inArray(driveMembers.userId, [...already]),
					),
				);
		}
		return added;
	}

	/** Remove one member. The owner cannot be removed — they are the drive. */
	async removeMember(
		driveId: string,
		actingUserId: string,
		userId: string,
	): Promise<void> {
		// Leaving is always allowed; removing anyone else is a manager's job.
		if (userId !== actingUserId) {
			await this.requireManager(driveId, actingUserId);
		} else {
			await this.requireAccess(driveId, actingUserId);
		}
		await this.db
			.delete(driveMembers)
			.where(
				and(eq(driveMembers.driveId, driveId), eq(driveMembers.userId, userId)),
			);
	}
}

const drivesService = new DrivesService();

/**
 * A storage service bound to one drive: the owner's rows, the actor's name on
 * anything logged, and the drive's own directory created if this is the first
 * time anyone has opened it.
 */
export async function driveStorage(
	drive: Drive,
	role: DriveRole,
	actor: NonNullable<App.Locals["user"]>,
): Promise<StorageService> {
	const owner = await loadDriveOwner(drive.ownerId);
	const service = new StorageService(owner, driveVolume(drive, role), actor);
	await service.ensureUserDirectory();
	return service;
}

/** The owner as a user row — `StorageService` needs the object, not the id. */
async function loadDriveOwner(
	ownerId: string,
): Promise<NonNullable<App.Locals["user"]>> {
	const [row] = await getDb().select().from(user).where(eq(user.id, ownerId));
	if (!row) {
		throw new DriveAccessError(404, "No such drive");
	}
	return row as unknown as NonNullable<App.Locals["user"]>;
}

export { drivesService };
