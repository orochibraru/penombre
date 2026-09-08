// biome-ignore-all lint/suspicious/useAwait: methods implement the async CacheBackend contract; `async` keeps the Promise return type without wrapping every result.
import type { CacheBackend } from "./types";

/**
 * No-op cache backend. All operations are harmless stubs.
 * Used in dev mode when no Redis is configured to avoid stale data.
 */
export class NullCacheBackend implements CacheBackend {
	async get<T>(): Promise<T | undefined> {}
	async set(): Promise<void> {
		// no-op: nothing is ever cached
	}
	async delete(): Promise<boolean> {
		return false;
	}
	async deleteByPrefix(): Promise<number> {
		return 0;
	}
	async clear(): Promise<void> {
		// no-op: nothing is ever cached
	}
	async getSize(): Promise<number> {
		return 0;
	}
}
