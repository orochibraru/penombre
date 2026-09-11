import type { Mock } from "bun:test";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { isAuthBypassed, isSimpleMode } from "$lib/server/config";

const mockIsSimpleMode = isSimpleMode as Mock<typeof isSimpleMode>;
const mockIsAuthBypassed = isAuthBypassed as Mock<typeof isAuthBypassed>;

const simpleModePages = {
	recent: (await import("./recent/+page.server")).load,
	starred: (await import("./starred/+page.server")).load,
	shared: (await import("./shared/+page.server")).load,
	categories: (await import("./categories/[category]/+page.server")).load,
};

const bypassSections = {
	account: (await import("./account/+layout.server")).load,
	admin: (await import("./admin/+layout.server")).load,
};

const adminEvent = { locals: { user: { role: "admin" } } } as never;

// `shared` reads the caller's own links, so unlike the other simple-mode pages
// it needs a real event and returns data rather than undefined.
const sharedEvent = {
	locals: { user: { id: "user-1" } },
	depends: () => {},
} as never;

const simpleModeEvents: Record<string, never> = { shared: sharedEvent };
const simpleModeResults: Record<string, unknown> = {
	shared: { shares: [], sharedWithMe: [] },
};

// The config mocks are module-level and shared across test files — leaving one
// flipped on would reconfigure every suite that runs after this one.
afterEach(() => {
	mockIsSimpleMode.mockReturnValue(false);
	mockIsAuthBypassed.mockReturnValue(false);
});

describe("pages disabled by simple mode", () => {
	beforeEach(() => {
		mockIsSimpleMode.mockReturnValue(false);
	});

	for (const [name, load] of Object.entries(simpleModePages)) {
		const event = simpleModeEvents[name] ?? ({} as never);

		test(`${name} loads normally when simple mode is off`, async () => {
			expect(await load(event)).toEqual(simpleModeResults[name] as never);
		});

		test(`${name} 404s in simple mode`, () => {
			mockIsSimpleMode.mockReturnValue(true);

			expect(() => load(event)).toThrow(
				expect.objectContaining({ status: 404 }),
			);
		});
	}
});

describe("sections disabled by auth bypass", () => {
	beforeEach(() => {
		mockIsAuthBypassed.mockReturnValue(false);
	});

	for (const [name, load] of Object.entries(bypassSections)) {
		test(`${name} loads normally when auth is not bypassed`, () => {
			expect(load(adminEvent)).toEqual({ hasCustomMenu: true } as never);
		});

		test(`${name} 404s when auth is bypassed`, () => {
			mockIsAuthBypassed.mockReturnValue(true);

			expect(() => load(adminEvent)).toThrow(
				expect.objectContaining({ status: 404 }),
			);
		});
	}
});
