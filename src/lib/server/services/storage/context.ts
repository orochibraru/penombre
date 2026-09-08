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
	readonly user: User;
	/** `user-<id>`, the per-user root inside the storage backend */
	readonly userFolder: string;
	/** Local filesystem base, used for thumbnail caching (always local) */
	readonly storagePath: string;
	readonly db: ReturnType<typeof getDb>;
	readonly cache: CacheBackend;
	readonly driver: StorageDriver;
	readonly activityService: ActivityService;
	/** Drop every cached listing after a mutation */
	invalidateListingCaches: () => Promise<void>;
}
