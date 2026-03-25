import type { CacheBackend } from "./types";

/**
 * In-memory cache backend backed by a Map with TTL support.
 */
export class MemoryCacheBackend implements CacheBackend {
	private cache = new Map<string, { value: unknown; expiresAt: number }>();
	private readonly defaultTTL: number;

	constructor(defaultTTLSeconds = 60) {
		this.defaultTTL = defaultTTLSeconds * 1000;
	}

	async get<T>(key: string): Promise<T | undefined> {
		const entry = this.cache.get(key);
		if (!entry) return undefined;

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}

		return entry.value as T;
	}

	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
		this.cache.set(key, {
			value,
			expiresAt: Date.now() + ttl,
		});
	}

	async delete(key: string): Promise<boolean> {
		return this.cache.delete(key);
	}

	async deleteByPrefix(prefix: string): Promise<number> {
		let count = 0;
		for (const key of this.cache.keys()) {
			if (key.startsWith(prefix)) {
				this.cache.delete(key);
				count++;
			}
		}
		return count;
	}

	async clear(): Promise<void> {
		this.cache.clear();
	}

	async getSize(): Promise<number> {
		return this.cache.size;
	}
}
