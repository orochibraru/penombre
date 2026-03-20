import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { getPenombreConfig } from "$lib/server/config";

const mockGetPenombreConfig = getPenombreConfig as Mock<
	typeof getPenombreConfig
>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns config when email sign-in is enabled", () => {
		const config = {
			auth: { enableEmailSignIn: true },
		};
		mockGetPenombreConfig.mockReturnValueOnce(config as never);

		const result = load();
		expect(result).toEqual({ config });
	});

	test("throws 404 when email sign-in is disabled", () => {
		mockGetPenombreConfig.mockReturnValueOnce({
			auth: { enableEmailSignIn: false },
		} as never);

		expect(() => load()).toThrow();
	});
});
