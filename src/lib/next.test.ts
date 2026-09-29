import { describe, expect, test } from "bun:test";
import { nextPath, signInReturningTo } from "./next";

const at = (search: string) => new URL(`http://app.test/auth/sign-in${search}`);

describe("nextPath", () => {
	test("keeps a path on this site", () => {
		expect(nextPath(at("?next=%2Fauth%2Fdevice%3Fuser_code%3DAB12"), "/")).toBe(
			"/auth/device?user_code=AB12",
		);
	});

	test("refuses anything that leaves the site", () => {
		for (const next of [
			"//evil.test",
			"/\\evil.test",
			"https://evil.test",
			"evil",
		]) {
			expect(nextPath(at(`?next=${encodeURIComponent(next)}`), "/home")).toBe(
				"/home",
			);
		}
		expect(nextPath(at(""), "/home")).toBe("/home");
	});
});

describe("signInReturningTo", () => {
	test("home needs no next", () => {
		expect(signInReturningTo({ pathname: "/", search: "" })).toBe(
			"/auth/sign-in",
		);
	});

	test("carries the path and query back", () => {
		expect(
			signInReturningTo({ pathname: "/auth/device", search: "?user_code=AB" }),
		).toBe("/auth/sign-in?next=%2Fauth%2Fdevice%3Fuser_code%3DAB");
	});
});
