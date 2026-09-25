/**
 * Shared state for the storage modules.
 *
 * `StorageService` owns one context per user and hands it to each operations
 * module, so they all read and write through the same database handle,
 * driver and activity log without depending on one another.
 */

import type { User } from "better-auth";
import type { getDb } from "#lib/server/db/index.js";
import type { ActivityService } from "#lib/server/services/activity.js";
import type { StorageDriver } from "./driver";

export interface StorageContext {
	/** Whose rows these are: the drive's owner, not necessarily who is asking. */
	readonly user: User;
	/**
	 * Who is asking. The same as `user` on a personal drive; on a shared one
	 * it is the member acting, which is what an activity row must record —
	 * otherwise every edit in a shared drive is logged as its creator's.
	 */
	readonly actor: User;
	/** `user-<id>`, the per-user root inside the storage backend */
	readonly userFolder: string;
	/**
	 * A tree people also browse outside Penombre (simple mode, a volume):
	 * new folders are named after themselves on disk, not a UUID.
	 */
	readonly namedPaths: boolean;
	/**
	 * The mounted volume this context reads and writes, or null for the user's
	 * own drive. Every `files`/`folders` query filters on it, so a service
	 * bound to a volume can never see or touch another one's rows.
	 */
	readonly volumeId: string | null;
	/**
	 * The part of the tree a recipient of a user-to-user share may reach: one
	 * folder and everything under it, or one file. Absent is the whole tree.
	 * `ownedFiles`/`ownedFolders` apply it, so every query inherits it.
	 */
	readonly scope?: StorageScope;
	/** Refuse writes — set for volumes declared read-only. */
	readonly readOnly: boolean;
	/** New bytes here are sealed. Reads never trust it: they sniff the file. */
	readonly encrypted: boolean;
	/** Local filesystem base, used for thumbnail caching (always local) */
	readonly storagePath: string;
	readonly db: ReturnType<typeof getDb>;
	readonly driver: StorageDriver;
	readonly activityService: ActivityService;
}

export type StorageScope =
	| { kind: "folder"; path: string }
	/** `folderId` is the file's parent, so that folder can be listed. */
	| { kind: "file"; fileId: string; folderId: string | null };
