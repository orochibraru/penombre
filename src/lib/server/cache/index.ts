/**
 * Cache backend abstraction.
 *
 * Provides a unified async interface for caching with pluggable backends:
 * - **MemoryCacheBackend** — in-process Map-based cache (default)
 * - **RedisCacheBackend** — distributed Redis-backed cache
 * - **NullCacheBackend** — no-op cache (used in dev mode)
 */

export { MemoryCacheBackend } from "./memory";
export { NullCacheBackend } from "./null";
export { closeRedis, getRedisClient, RedisCacheBackend } from "./redis";
export type { CacheBackend } from "./types";
