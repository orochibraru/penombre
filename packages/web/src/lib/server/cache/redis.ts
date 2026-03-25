import Redis from "ioredis";
import type { CacheBackend } from "./types";

// ---------------------------------------------------------------------------
// Serialization helpers — handles Map objects that JSON.stringify loses
// ---------------------------------------------------------------------------

function serialize(value: unknown): string {
	return JSON.stringify(value, (_key, v) =>
		v instanceof Map ? { __type: "Map", entries: Array.from(v.entries()) } : v,
	);
}

function deserialize<T>(raw: string): T {
	return JSON.parse(raw, (_key, v) =>
		v?.__type === "Map" && Array.isArray(v.entries) ? new Map(v.entries) : v,
	) as T;
}

// ---------------------------------------------------------------------------
// Redis client singleton (HMR-safe, same pattern as db/index.ts)
// ---------------------------------------------------------------------------

const globalForRedis = globalThis as unknown as {
	__redis_client?: Redis;
};

export function getRedisClient(url?: string): Redis {
	if (globalForRedis.__redis_client) {
		return globalForRedis.__redis_client;
	}

	const redisUrl = url ?? process.env.REDIS_URL ?? "redis://localhost:6379";

	const client = new Redis(redisUrl, {
		maxRetriesPerRequest: 3,
		lazyConnect: true,
		retryStrategy(times) {
			return Math.min(times * 200, 5000);
		},
	});

	// Attach basic event handlers to avoid unhandled 'error' events and to log connectivity changes.
	client.on("error", (err) => {
		console.error("[redis] Client error:", err);
	});
	client.on("connect", () => {
		console.info("[redis] Connected to Redis");
	});
	client.on("reconnecting", () => {
		console.warn("[redis] Reconnecting to Redis...");
	});
	client.on("end", () => {
		console.warn("[redis] Redis connection closed");
	});
	globalForRedis.__redis_client = client;
	return client;
}

export async function closeRedis(): Promise<void> {
	if (globalForRedis.__redis_client) {
		await globalForRedis.__redis_client.quit();
		globalForRedis.__redis_client = undefined;
	}
}

// ---------------------------------------------------------------------------
// Redis cache backend
// ---------------------------------------------------------------------------

/**
 * Distributed cache backend using Redis.
 * Keys are namespaced so multiple users / concerns stay isolated.
 */
export class RedisCacheBackend implements CacheBackend {
	private client: Redis;
	private readonly namespace: string;
	private readonly defaultTTL: number;

	constructor(client: Redis, namespace: string, defaultTTLSeconds = 60) {
		this.client = client;
		this.namespace = namespace;
		this.defaultTTL = defaultTTLSeconds;
	}

	private fullKey(key: string): string {
		return `${this.namespace}:${key}`;
	}

	async get<T>(key: string): Promise<T | undefined> {
		const raw = await this.client.get(this.fullKey(key));
		if (raw === null) return undefined;
		return deserialize<T>(raw);
	}

	async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		const ttl = ttlSeconds ?? this.defaultTTL;
		await this.client.setex(this.fullKey(key), ttl, serialize(value));
	}

	async delete(key: string): Promise<boolean> {
		const result = await this.client.del(this.fullKey(key));
		return result > 0;
	}

	async deleteByPrefix(prefix: string): Promise<number> {
		const pattern = `${this.fullKey(prefix)}*`;
		let count = 0;
		let cursor = "0";
		do {
			const [nextCursor, keys] = await this.client.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				100,
			);
			cursor = nextCursor;
			if (keys.length > 0) {
				count += await this.client.del(...keys);
			}
		} while (cursor !== "0");
		return count;
	}

	async clear(): Promise<void> {
		await this.deleteByPrefix("");
	}

	async getSize(): Promise<number> {
		const pattern = `${this.namespace}:*`;
		let count = 0;
		let cursor = "0";
		do {
			const [nextCursor, keys] = await this.client.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				100,
			);
			cursor = nextCursor;
			count += keys.length;
		} while (cursor !== "0");
		return count;
	}
}
