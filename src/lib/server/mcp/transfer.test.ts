import { describe, expect, test } from "bun:test";
import { readGrant, transferUrl } from "./transfer";

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
