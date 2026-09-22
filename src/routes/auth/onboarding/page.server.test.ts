import { describe, expect, test } from "bun:test";
import { fail } from "@sveltejs/kit";

const { actions } = await import("./+page.server");

function createRequest(data: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(data)) {
		formData.append(key, value);
	}
	return {
		request: new Request("http://localhost", {
			method: "POST",
			body: formData,
		}),
	};
}

/**
 * These assert the stable *codes* `setPassword` fails with, never English
 * prose, which used to reach every locale verbatim (see `#lib/form-errors.ts`,
 * which maps them back to a translated message client-side).
 */
describe("actions.setPassword", () => {
	test("an empty token fails with a code, not a sentence", async () => {
		const result = await actions.setPassword(createRequest({}) as never);
		expect(result).toEqual(fail(400, { error: "INVITE_INVALID" }));
	});

	test("mismatched passwords", async () => {
		const result = await actions.setPassword(
			createRequest({
				token: "tok",
				password: "hunter2hunter2",
				confirm: "something-else",
			}) as never,
		);
		expect(result).toEqual(fail(400, { error: "PASSWORD_MISMATCH" }));
	});

	test("a password shorter than the configured minimum carries its count", async () => {
		const result = await actions.setPassword(
			createRequest({
				token: "tok",
				password: "short",
				confirm: "short",
			}) as never,
		);
		expect(result).toEqual(
			fail(400, {
				error: "PASSWORD_TOO_SHORT",
				errorParams: { count: "8" },
			}),
		);
	});
});
