import { describe, expect, test } from "bun:test";

import { appView, appViewQuery } from "#lib/app-view.js";

const none = { get: () => undefined };
const dark = { get: () => "dark" };

describe("appView", () => {
	test("reads the query first", () => {
		expect(appView(new URL("https://x/browse?app=dark"), none)).toBe("dark");
		expect(appView(new URL("https://x/browse?app=light"), dark)).toBe("light");
		expect(appView(new URL("https://x/browse?app=1&theme=dark"), none)).toBe(
			"dark",
		);
		expect(appView(new URL("https://x/browse?app=1"), none)).toBe("light");
	});

	test("falls back to the cookie", () => {
		expect(appView(new URL("https://x/browse"), dark)).toBe("dark");
		expect(appView(new URL("https://x/browse"), none)).toBeNull();
		expect(appView(new URL("https://x/browse"), { get: () => "x" })).toBeNull();
	});

	test("app=0 turns it off", () => {
		expect(appViewQuery(new URL("https://x/?app=0"))).toBe("off");
		expect(appView(new URL("https://x/?app=0"), dark)).toBeNull();
	});
});
