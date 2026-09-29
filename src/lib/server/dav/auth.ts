import { createHash } from "node:crypto";

export const DAV_CHALLENGE = {
	"www-authenticate": 'Basic realm="Penombre", charset="UTF-8"',
};

/** A WebDAV client puts the API key in Basic's password. */
export function basicPassword(header: string | null): string | null {
	if (!header?.startsWith("Basic ")) {
		return null;
	}
	const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
	const colon = decoded.indexOf(":");
	if (colon === -1 || colon === decoded.length - 1) {
		return null;
	}
	return decoded.slice(colon + 1);
}

const TTL_MS = 60_000;
const verified = new Map<string, { user: unknown; until: number }>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * A sync client sends a request per file; the API-key plugin allows 100 a
 * minute. Costs a revoked key up to a minute of life. Concurrent misses share
 * one verification: rclone's parallel requests all missing at expiry spent the
 * key's budget in a burst.
 */
export function cachedKeyUser<U>(
	key: string,
	verify: (key: string) => Promise<U | null>,
	now = Date.now(),
): Promise<U | null> {
	const id = createHash("sha256").update(key).digest("hex");
	const hit = verified.get(id);
	if (hit && hit.until > now) {
		return Promise.resolve(hit.user as U);
	}
	const pending = inFlight.get(id);
	if (pending) {
		return pending as Promise<U | null>;
	}
	const check = verify(key)
		.then((user) => {
			if (user) {
				verified.set(id, { user, until: now + TTL_MS });
			} else {
				verified.delete(id);
			}
			return user;
		})
		.finally(() => inFlight.delete(id));
	inFlight.set(id, check);
	return check;
}

/** What a failed attempt may log. A Basic password may be the account's. */
export function keyHint(
	rawKey: string,
	fromBasic: boolean,
): string | undefined {
	return fromBasic ? undefined : rawKey.slice(0, 8);
}
