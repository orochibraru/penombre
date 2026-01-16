import { Logger } from "$lib/logger";

const logger = new Logger("StorageCache");

/**
 * Cache entry with value and expiration timestamp.
 */
interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

/**
 * Simple in-memory cache with TTL support.
 * Per-user cache instances are stored in a global map.
 */
class MemoryCache {
	private cache = new Map<string, CacheEntry<unknown>>();
	private readonly defaultTTL: number;

	constructor(defaultTTLSeconds = 60) {
		this.defaultTTL = defaultTTLSeconds * 1000;
	}

	/**
	 * Get a value from cache.
	 */
	get<T>(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) {
			return undefined;
		}

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}

		return entry.value as T;
	}

	/**
	 * Set a value in cache with optional TTL override.
	 */
	set<T>(key: string, value: T, ttlSeconds?: number): void {
		const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
		this.cache.set(key, {
			value,
			expiresAt: Date.now() + ttl,
		});
	}

	/**
	 * Delete a specific key from cache.
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Delete all keys matching a prefix.
	 */
	deleteByPrefix(prefix: string): number {
		let count = 0;
		for (const key of this.cache.keys()) {
			if (key.startsWith(prefix)) {
				this.cache.delete(key);
				count++;
			}
		}
		return count;
	}

	/**
	 * Clear all entries from cache.
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get the number of entries in cache.
	 */
	get size(): number {
		return this.cache.size;
	}
}

/**
 * Global cache store - one cache instance per user.
 * This ensures user data isolation while sharing memory efficiently.
 */
const userCaches = new Map<string, MemoryCache>();

/**
 * Get or create a cache instance for a specific user.
 */
export function getUserCache(userId: string): MemoryCache {
	let cache = userCaches.get(userId);
	if (!cache) {
		cache = new MemoryCache(30); // 30 second default TTL
		userCaches.set(userId, cache);
		logger.debug(`Created new cache for user ${userId}`);
	}
	return cache;
}

/**
 * Clear cache for a specific user.
 */
export function clearUserCache(userId: string): void {
	const cache = userCaches.get(userId);
	if (cache) {
		cache.clear();
		logger.debug(`Cleared cache for user ${userId}`);
	}
}

/**
 * Clear all user caches (useful for testing or admin operations).
 */
export function clearAllCaches(): void {
	for (const cache of userCaches.values()) {
		cache.clear();
	}
	userCaches.clear();
	logger.debug("Cleared all user caches");
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
};

export type { MemoryCache };
