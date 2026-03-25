import type { CacheBackend } from "./types";

/**
 * No-op cache backend. All operations are harmless stubs.
 * Used in dev mode when no Redis is configured to avoid stale data.
 */
export class NullCacheBackend implements CacheBackend {
	async get<T>(): Promise<T | undefined> {
		return undefined;
	}
	async set(): Promise<void> {}
	async delete(): Promise<boolean> {
		return false;
	}
	async deleteByPrefix(): Promise<number> {
		return 0;
	}
	async clear(): Promise<void> {}
	async getSize(): Promise<number> {
		return 0;
	}
}
