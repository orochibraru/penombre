import { describe, expect, test } from "bun:test";
import {
	PARENT_KEY,
	randomId,
	resolveDropDestination,
	resolveParentPath,
} from "$lib/utils";

describe("resolveParentPath", () => {
	test("is undefined where there is nothing to go up to", () => {
		// No `path` param at all: /browse, and every non-browse listing.
		expect(resolveParentPath(undefined)).toBeUndefined();
		expect(resolveParentPath("")).toBeUndefined();
	});

	test("returns the drive root one level down", () => {
		expect(resolveParentPath("photos")).toBe("");
	});

	test("drops the last segment of a nested path", () => {
		expect(resolveParentPath("photos/2024/summer")).toBe("photos/2024");
	});
});

describe("resolveDropDestination", () => {
	test("resolves the parent row to the folder above", () => {
		expect(resolveDropDestination(PARENT_KEY, "photos/2024")).toBe("photos");
		expect(resolveDropDestination(PARENT_KEY, "photos")).toBe("");
		expect(resolveDropDestination(PARENT_KEY, undefined)).toBe("");
	});

	test("resolves a folder row to a child of the current folder", () => {
		expect(resolveDropDestination("summer/", "photos/2024")).toBe(
			"photos/2024/summer",
		);
		expect(resolveDropDestination("photos/", undefined)).toBe("photos");
	});
});

describe("randomId", () => {
	test("is unique across calls", () => {
		const ids = new Set(Array.from({ length: 200 }, () => randomId()));
		expect(ids.size).toBe(200);
	});

	test("works without crypto.randomUUID (an insecure context)", () => {
		// Plain HTTP at a LAN address: the property is simply absent, and
		// reaching for it used to throw and take the waveform down with it.
		// Defined on the instance rather than deleted — it lives on
		// `Crypto.prototype`, so deleting the own property changes nothing.
		Object.defineProperty(globalThis.crypto, "randomUUID", {
			value: undefined,
			configurable: true,
		});
		try {
			expect(randomId()).toMatch(/^[0-9a-f]{32}$/);
		} finally {
			// biome-ignore lint/performance/noDelete: uncovers the prototype's own implementation again
			delete (globalThis.crypto as { randomUUID?: unknown }).randomUUID;
		}
	});

	test("still works with no crypto at all", () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
		Object.defineProperty(globalThis, "crypto", {
			value: undefined,
			configurable: true,
		});
		try {
			expect(randomId().length).toBeGreaterThan(8);
		} finally {
			if (original) {
				Object.defineProperty(globalThis, "crypto", original);
			}
		}
	});
});
