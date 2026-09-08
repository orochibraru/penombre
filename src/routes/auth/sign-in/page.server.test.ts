import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { getConfig } from "$lib/server/config";

const mockGetConfig = getConfig as Mock<typeof getConfig>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns authConfig from config", () => {
		const authConfig = {
			enableEmailSignIn: true,
			enableOAuth: false,
			enablePasskeys: true,
		};
		mockGetConfig.mockReturnValueOnce({ auth: authConfig } as never);

		const result = load();
		expect(result).toEqual({ authConfig });
	});

	test("returns authConfig when email sign-in is disabled", () => {
		const authConfig = {
			enableEmailSignIn: false,
			enableOAuth: true,
			enablePasskeys: false,
		};
		mockGetConfig.mockReturnValueOnce({ auth: authConfig } as never);

		const result = load();
		expect(result).toEqual({ authConfig });
	});
});
