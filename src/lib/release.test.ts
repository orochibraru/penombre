import { describe, expect, test } from "bun:test";

import {
	assetUrl,
	channelOf,
	desktopReleaseVersion,
	offeredRelease,
	phoneSystem,
} from "#lib/release.js";

describe("release helpers", () => {
	test("an asset is downloaded from its release", () => {
		expect(assetUrl("1.9.0-canary.2", "penombre-android.apk")).toBe(
			"https://github.com/orochibraru/penombre/releases/download/v1.9.0-canary.2/penombre-android.apk",
		);
	});

	test("a phone is told from a computer by its user agent", () => {
		expect(
			phoneSystem("Mozilla/5.0 (Linux; Android 16; Pixel 9) Chrome/140 Mobile"),
		).toBe("android");
		expect(
			phoneSystem("Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X)"),
		).toBe("ios");
		expect(
			phoneSystem("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari"),
		).toBeUndefined();
		// Desktop Linux is not Android.
		expect(
			phoneSystem("Mozilla/5.0 (X11; Linux x86_64) Firefox/140"),
		).toBeUndefined();
	});
});

describe("which release to offer", () => {
	test("a canary is told by its tag", () => {
		expect(channelOf("1.9.0-canary.2")).toBe("canary");
		expect(channelOf("1.9.0")).toBe("stable");
	});

	test("the server's own release, when it is on the channel followed", () => {
		expect(desktopReleaseVersion("1.9.0", "stable", "1.10.0")).toBe("1.9.0");
		expect(
			desktopReleaseVersion("1.9.0-canary.2", "canary", "1.9.0-canary.5"),
		).toBe("1.9.0-canary.2");
	});

	test("the other channel's newest, or its own when there is none", () => {
		expect(desktopReleaseVersion("1.9.0", "canary", "1.10.0-canary.1")).toBe(
			"1.10.0-canary.1",
		);
		expect(desktopReleaseVersion("1.9.0", "canary", null)).toBe("1.9.0");
	});

	test("reads the streamed version check", async () => {
		expect(
			await offeredRelease({
				versionCheck: Promise.resolve({
					currentVersion: "1.9.0",
					channel: "canary",
					latestVersion: "1.10.0-canary.3",
				}),
				config: { appVersion: "1.9.0" },
			}),
		).toBe("1.10.0-canary.3");
	});

	test("falls back to the server's version without a check", async () => {
		expect(
			await offeredRelease({
				versionCheck: Promise.resolve(undefined),
				config: { appVersion: "1.9.0" },
			}),
		).toBe("1.9.0");
		expect(await offeredRelease({})).toBeUndefined();
	});
});
