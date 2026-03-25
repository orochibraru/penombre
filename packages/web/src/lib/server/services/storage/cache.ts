import { dev } from "$app/environment";
import { Logger } from "$lib/logger";
import type { CacheBackend } from "$lib/server/cache";
import {
	getRedisClient,
	MemoryCacheBackend,
	NullCacheBackend,
	RedisCacheBackend,
} from "$lib/server/cache";

const logger = new Logger("StorageCache");

/**
 * Manager for user-specific cache instances.
 * Selects the appropriate backend (Redis, memory, or null) based on
 * environment and configuration.
 */
export class CacheManager {
	private userCaches = new Map<string, CacheBackend>();
	private redisUrl: string | undefined;

	constructor() {
		this.redisUrl = process.env.REDIS_URL;
	}

	getUserCache(userId: string): CacheBackend {
		let cache = this.userCaches.get(userId);
		if (!cache) {
			cache = this.createBackend(userId);
			this.userCaches.set(userId, cache);
			logger.debug(`Created new cache for user ${userId}`);
		}
		return cache;
	}

	async clearUserCache(userId: string): Promise<void> {
		const cache = this.userCaches.get(userId);
		if (cache) {
			await cache.clear();
			logger.debug(`Cleared cache for user ${userId}`);
		}
	}

	async clearAllCaches(): Promise<void> {
		await Promise.all(
			Array.from(this.userCaches.values()).map((cache) => cache.clear()),
		);
		this.userCaches.clear();
		logger.debug("Cleared all user caches");
	}

	private createBackend(userId: string): CacheBackend {
		// In dev mode without Redis, disable caching to avoid stale data
		if (dev && !this.redisUrl) {
			return new NullCacheBackend();
		}

		if (this.redisUrl) {
			const client = getRedisClient(this.redisUrl);
			return new RedisCacheBackend(client, `penombre:cache:${userId}`, 30);
		}

		return new MemoryCacheBackend(30);
	}
}

/**
 * Cache key generators for consistent key formatting.
 */
export const CacheKeys = {
	/** Key for directory listing */
	listing: (prefix: string, options?: string) =>
		`list:${prefix || "root"}${options ? `:${options}` : ""}`,

	/** Key for folder listing */
	folders: (prefix: string, trashedOnly = false) =>
		`folders:${prefix || "root"}:${trashedOnly ? "trashed" : "normal"}`,

	/** Key for file metadata */
	fileMeta: (key: string) => `meta:${key}`,

	/** Key for folder metadata */
	folderMeta: (key: string) => `folder-meta:${key}`,

	/** Key for folder size */
	folderSize: (folderKey: string) => `folder-size:${folderKey}`,

	/** Key for starred files list */
	starred: () => "starred",

	/** Key for trashed files list */
	trashed: () => "trashed",

	/** Key for recent files list */
	recent: () => "recent",

	/** Key for category listing */
	category: (category: string) => `category:${category}`,

	/** Key for counts (trash/starred) */
	counts: () => "counts",

	/** Key for the file ID → relative path index */
	fileIdIndex: () => "file-id-index",
};
