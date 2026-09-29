import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { instanceSignInMethods } from "#lib/server/auth/index.js";

const mockMethods = instanceSignInMethods as Mock<typeof instanceSignInMethods>;
const methods = (password: boolean) => ({
	password,
	passkey: false,
	magicLink: false,
	emailOtp: false,
});

const { load } = await import("./+page.server");

describe("load", () => {
	test("is not found while password sign-in is off", async () => {
		mockMethods.mockResolvedValueOnce(methods(false));
		await expect(load()).rejects.toMatchObject({ status: 404 });
	});

	test("says whether a link can be mailed", async () => {
		mockMethods.mockResolvedValueOnce(methods(true));
		mockMethods.mockResolvedValueOnce(methods(true));
		const result = await load();
		expect(typeof result.canMail).toBe("boolean");
	});
});
