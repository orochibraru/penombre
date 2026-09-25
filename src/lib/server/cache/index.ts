/**
 * Cache backend abstraction.
 *
 * The rate limiter's store: in-process by default, Redis with `REDIS_URL` so
 * several app instances share one set of counters.
 */

export { MemoryCacheBackend } from "./memory";
export { closeRedis, getRedisClient, RedisCacheBackend } from "./redis";
export type { CacheBackend } from "./types";
