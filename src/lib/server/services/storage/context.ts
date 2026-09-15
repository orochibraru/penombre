/**
 * Shared state for the storage modules.
 *
 * `StorageService` owns one context per user and hands it to each operations
 * module, so they all read and write through the same database handle, cache,
 * driver and activity log without depending on one another.
 */

import type { User } from "better-auth";
import type { CacheBackend } from "$lib/server/cache";
import type { getDb } from "$lib/server/db";
import type { ActivityService } from "$lib/server/services/activity";
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
	 * The mounted volume this context reads and writes, or null for the user's
	 * own drive. Every `files`/`folders` query filters on it, so a service
	 * bound to a volume can never see or touch another one's rows.
	 */
	readonly volumeId: string | null;
	/** Refuse writes — set for volumes declared read-only. */
	readonly readOnly: boolean;
	/** Local filesystem base, used for thumbnail caching (always local) */
	readonly storagePath: string;
	readonly db: ReturnType<typeof getDb>;
	readonly cache: CacheBackend;
	readonly driver: StorageDriver;
	readonly activityService: ActivityService;
	/** Drop every cached listing after a mutation */
	invalidateListingCaches: () => Promise<void>;
}
