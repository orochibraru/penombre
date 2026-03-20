import { beforeEach, describe, expect, type Mock, mock, test } from "bun:test";
import { getPenombreConfig } from "$lib/server/config";

const mockGetPenombreConfig = getPenombreConfig as Mock<
	typeof getPenombreConfig
>;

const originalFetch = globalThis.fetch;

function mockFetchResponse(body: unknown, status = 200) {
	globalThis.fetch = mock(() =>
		Promise.resolve(new Response(JSON.stringify(body), { status })),
	) as typeof globalThis.fetch;
}

function mockFetchFailure(error: Error) {
	globalThis.fetch = mock(() =>
		Promise.reject(error),
	) as typeof globalThis.fetch;
}

// Re-import for each describe to get a fresh module-level cache
async function importFresh() {
	// Clear the module from cache so we get a fresh `cache = null`
	const modulePath = import.meta.resolveSync("$lib/server/services/version");

	delete require.cache[modulePath];
	return await import("./version");
}

describe("checkForUpdate", () => {
	beforeEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("returns update available when latest is newer", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.0.0",
		} as never);
		mockFetchResponse({
			tag_name: "v1.1.0",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.1.0",
		});

		const result = await checkForUpdate();

		expect(result).toEqual({
			currentVersion: "1.0.0",
			latestVersion: "1.1.0",
			updateAvailable: true,
			releaseUrl: "https://github.com/orochibraru/penombre/releases/tag/v1.1.0",
		});
	});

	test("returns no update when versions are equal", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.0.0",
		} as never);
		mockFetchResponse({
			tag_name: "v1.0.0",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.0.0",
		});

		const result = await checkForUpdate();

		expect(result.updateAvailable).toBe(false);
		expect(result.latestVersion).toBe("1.0.0");
	});

	test("returns no update when current is newer than latest", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "2.0.0",
		} as never);
		mockFetchResponse({
			tag_name: "v1.5.0",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.5.0",
		});

		const result = await checkForUpdate();

		expect(result.updateAvailable).toBe(false);
		expect(result.currentVersion).toBe("2.0.0");
		expect(result.latestVersion).toBe("1.5.0");
	});

	test("returns no update when version is development", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "development",
		} as never);
		mockFetchResponse({
			tag_name: "v1.0.0",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.0.0",
		});

		const result = await checkForUpdate();

		expect(result.updateAvailable).toBe(false);
		expect(result.currentVersion).toBe("development");
		expect(result.latestVersion).toBe("1.0.0");
	});

	test("handles GitHub API non-ok response", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.0.0",
		} as never);
		mockFetchResponse({ message: "rate limited" }, 403);

		const result = await checkForUpdate();

		expect(result).toEqual({
			currentVersion: "1.0.0",
			latestVersion: null,
			updateAvailable: false,
			releaseUrl: null,
		});
	});

	test("handles fetch network error", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.0.0",
		} as never);
		mockFetchFailure(new Error("Network error"));

		const result = await checkForUpdate();

		expect(result).toEqual({
			currentVersion: "1.0.0",
			latestVersion: null,
			updateAvailable: false,
			releaseUrl: null,
		});
	});

	test("returns cached result on subsequent calls within TTL", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValue({ appVersion: "1.0.0" } as never);
		mockFetchResponse({
			tag_name: "v1.1.0",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.1.0",
		});

		// First call — fetches from GitHub
		await checkForUpdate();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);

		// Second call — should use cache, no additional fetch
		const result = await checkForUpdate();
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		expect(result.updateAvailable).toBe(true);
		expect(result.latestVersion).toBe("1.1.0");
	});

	test("normalizes tag_name with v prefix", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.0.0",
		} as never);
		mockFetchResponse({
			tag_name: "v1.2.3",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.2.3",
		});

		const result = await checkForUpdate();

		expect(result.latestVersion).toBe("1.2.3");
	});

	test("handles patch version comparison correctly", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.0.0",
		} as never);
		mockFetchResponse({
			tag_name: "v1.0.1",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v1.0.1",
		});

		const result = await checkForUpdate();

		expect(result.updateAvailable).toBe(true);
	});

	test("handles major version comparison correctly", async () => {
		const { checkForUpdate } = await importFresh();
		mockGetPenombreConfig.mockReturnValueOnce({
			appVersion: "1.9.9",
		} as never);
		mockFetchResponse({
			tag_name: "v2.0.0",
			html_url: "https://github.com/orochibraru/penombre/releases/tag/v2.0.0",
		});

		const result = await checkForUpdate();

		expect(result.updateAvailable).toBe(true);
	});
});
