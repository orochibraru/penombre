import { describe, expect, test } from "bun:test";
import { isHttpError } from "@sveltejs/kit";
import { requireAdmin } from "./require-admin";

function refusal(locals: Parameters<typeof requireAdmin>[0]) {
	try {
		requireAdmin(locals);
		return null;
	} catch (error) {
		return isHttpError(error) ? error.status : "not an HttpError";
	}
}

describe("requireAdmin", () => {
	test("lets an admin through", () => {
		expect(refusal({ user: { role: "admin" } as never })).toBeNull();
	});

	test("refuses everyone else with a 403", () => {
		expect(refusal({ user: { role: "user" } as never })).toBe(403);
		expect(refusal({ user: null })).toBe(403);
		expect(refusal({ user: undefined })).toBe(403);
	});
});
