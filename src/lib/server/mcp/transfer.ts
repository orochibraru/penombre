import { createHmac, timingSafeEqual } from "node:crypto";
import { inArray } from "drizzle-orm";
import { getConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import { user as userTable } from "#lib/server/db/schema.js";

/**
 * A link that moves one file's bytes without the model carrying them: the
 * assistant's shell `curl`s it. Stateless, so it outlives a revoked key by
 * at most its lifetime; the account and its access are checked on use.
 */

export const TRANSFER_PATH = "/mcp/transfer";
const LIFETIME_MS = 15 * 60_000;

export interface Grant {
	user: string;
	owner: string;
	path: string;
	method: "GET" | "PUT";
	expires: number;
}

function mac(body: string): Buffer {
	return createHmac("sha256", getConfig().auth.secret)
		.update(`mcp-transfer:${body}`)
		.digest();
}

export function transferUrl(
	base: URL,
	grant: Omit<Grant, "expires">,
	now = Date.now(),
): { url: string; expires: string } {
	const expires = now + LIFETIME_MS;
	const body = Buffer.from(JSON.stringify({ ...grant, expires })).toString(
		"base64url",
	);
	const url = new URL(TRANSFER_PATH, getConfig().origin || base);
	url.searchParams.set("token", `${body}.${mac(body).toString("base64url")}`);
	return { url: url.href, expires: new Date(expires).toISOString() };
}

export function readGrant(
	token: string | null,
	method: string,
	now = Date.now(),
): Grant | null {
	const [body, signature] = token?.split(".") ?? [];
	if (!body || !signature) {
		return null;
	}
	const given = Buffer.from(signature, "base64url");
	const expected = mac(body);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
		return null;
	}
	const grant = JSON.parse(Buffer.from(body, "base64url").toString()) as Grant;
	return grant.method === method && grant.expires > now ? grant : null;
}

type User = NonNullable<App.Locals["user"]>;

/** The grant's accounts, unless either is gone or banned since. */
export async function grantUsers(
	grant: Grant,
): Promise<{ user: User; owner: User } | null> {
	const rows = (await getDb()
		.select()
		.from(userTable)
		.where(inArray(userTable.id, [grant.user, grant.owner]))) as User[];
	const user = rows.find((row) => row.id === grant.user);
	const owner = rows.find((row) => row.id === grant.owner);
	if (!user || !owner || user.banned || owner.banned) {
		return null;
	}
	return { user, owner };
}
