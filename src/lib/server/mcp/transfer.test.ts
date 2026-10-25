import { afterEach, describe, expect, test } from "bun:test";

import { getDb } from "#lib/server/db/index.js";

import { grantUsers, readGrant, transferUrl } from "./transfer";

const grant = {
	user: "u1",
	owner: "u1",
	path: "/me/Videos/clip.mp4",
	method: "GET" as const,
};
const base = new URL("http://penombre.test/mcp");

function tokenOf(url: string): string {
	return new URL(url).searchParams.get("token") ?? "";
}

describe("transfer links", () => {
	test("a link reads back as its grant until it expires", () => {
		const now = 1_000_000;
		const { url } = transferUrl(base, grant, now);
		expect(new URL(url).pathname).toBe("/mcp/transfer");
		expect(readGrant(tokenOf(url), "GET", now + 60_000)).toMatchObject(grant);
		expect(readGrant(tokenOf(url), "GET", now + 16 * 60_000)).toBeNull();
	});

	test("a download link does not upload", () => {
		const { url } = transferUrl(base, grant);
		expect(readGrant(tokenOf(url), "PUT")).toBeNull();
	});

	test("a forged or altered token is refused", () => {
		const [body, signature] = tokenOf(transferUrl(base, grant).url).split(".");
		const other = Buffer.from(
			JSON.stringify({
				...grant,
				path: "/me/secret",
				expires: Date.now() + 1e6,
			}),
		).toString("base64url");
		expect(readGrant(`${other}.${signature}`, "GET")).toBeNull();
		expect(readGrant(`${body}.AAAA`, "GET")).toBeNull();
		expect(readGrant(body ?? "", "GET")).toBeNull();
		expect(readGrant(null, "GET")).toBeNull();
	});
});

describe("grant users", () => {
	const database = getDb() as unknown as { select: unknown };
	const select = database.select;
	afterEach(() => {
		database.select = select;
	});

	function rows(found: Record<string, unknown>[]) {
		database.select = () => ({
			from: () => ({ where: async () => found }),
		});
	}

	const signed = { ...grant, owner: "o1", expires: Date.now() + 60_000 };

	test("returns both accounts while they exist and are not banned", async () => {
		rows([
			{ id: "o1", banned: false },
			{ id: "u1", banned: null },
		]);
		expect(await grantUsers(signed)).toEqual({
			user: { id: "u1", banned: null },
			owner: { id: "o1", banned: false },
		} as never);
	});

	test("refuses a grant whose account is gone or banned", async () => {
		rows([{ id: "u1", banned: false }]);
		expect(await grantUsers(signed)).toBeNull();
		rows([
			{ id: "u1", banned: false },
			{ id: "o1", banned: true },
		]);
		expect(await grantUsers(signed)).toBeNull();
		rows([
			{ id: "u1", banned: true },
			{ id: "o1", banned: false },
		]);
		expect(await grantUsers(signed)).toBeNull();
	});

	test("one account can be both the user and the owner", async () => {
		rows([{ id: "u1", banned: false }]);
		expect(await grantUsers({ ...signed, owner: "u1" })).toEqual({
			user: { id: "u1", banned: false },
			owner: { id: "u1", banned: false },
		} as never);
	});
});
