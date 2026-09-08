import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { getConfig } from "$lib/server/config";

const mockGetConfig = getConfig as Mock<typeof getConfig>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns config when email sign-in is enabled", () => {
		const config = {
			auth: { enableEmailSignIn: true },
		};
		mockGetConfig.mockReturnValueOnce(config as never);

		const result = load();
		expect(result).toEqual({ config });
	});

	test("throws 404 when email sign-in is disabled", () => {
		mockGetConfig.mockReturnValueOnce({
			auth: { enableEmailSignIn: false },
		} as never);

		expect(() => load()).toThrow();
	});
});
