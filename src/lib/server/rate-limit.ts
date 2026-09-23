/**
 * A crude per-key throttle for anonymous endpoints better-auth's own limiter
 * never sees; it only covers `/api/v1/auth/**`, not `/s/[token]?/unlock`
 * (share password brute force) or `auth/sign-in?/lookup` (email/method
 * enumeration).
 *
 * ponytail: fixed window, not sliding, and the counter is a plain get+set;
 * not atomic, so two concurrent requests can both read the same count before
 * either writes. Good enough for a login/unlock throttle; move to Redis
 * `INCR` (or a sliding window) if it ever needs to be exact.
 */

import process from "node:process";
import type { CacheBackend } from "#lib/server/cache/index.js";
import {
	getRedisClient,
	MemoryCacheBackend,
	RedisCacheBackend,
} from "#lib/server/cache/index.js";

const globalForRateLimit = globalThis as unknown as {
	__rate_limit_memory?: CacheBackend;
};

/**
 * Only the in-memory counters are kept: a `RedisCacheBackend` holds the client
 * it was built with, and `closeRedis()` leaves that one closed forever, so the
 * Redis store is rebuilt per call around whatever client is live now.
 */
function store(): CacheBackend {
	const redisUrl = process.env.REDIS_URL;
	if (redisUrl) {
		return new RedisCacheBackend(
			getRedisClient(redisUrl),
			"penombre:ratelimit:",
		);
	}
	globalForRateLimit.__rate_limit_memory ??= new MemoryCacheBackend();
	return globalForRateLimit.__rate_limit_memory;
}

/** True when `key` has already used up its budget for the window. */
export async function isRateLimited(
	key: string,
	options: { max: number; windowSeconds: number },
): Promise<boolean> {
	const cache = store();
	const count = (await cache.get<number>(key)) ?? 0;
	if (count >= options.max) {
		return true;
	}
	// A fresh key gets the full window from here; a key mid-window keeps its
	// original expiry only approximately (each hit resets it); acceptable
	// for a throttle, not for billing.
	await cache.set(key, count + 1, options.windowSeconds);
	return false;
}
