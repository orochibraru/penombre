import { describe, expect, test } from "bun:test";
import { assetUrl, phoneSystem } from "#lib/release.js";

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
