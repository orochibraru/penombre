import RedisClient from "ioredis";

/**
 * Probes whether Redis is actually reachable at the given URL.
 * Returns `true` if a PING succeeds within 1 second, `false` otherwise.
 */
export async function isRedisAvailable(
	url: string | undefined,
): Promise<boolean> {
	if (!url) return false;

	const client = new RedisClient(url, {
		lazyConnect: true,
		maxRetriesPerRequest: 0,
		retryStrategy: () => null, // no retries
	});

	try {
		await client.connect();
		await client.ping();
		return true;
	} catch {
		return false;
	} finally {
		client.disconnect();
	}
}
