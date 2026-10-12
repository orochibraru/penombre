import { describe, expect, test } from "bun:test";

const { POST } = await import("./+server");

function call(body: unknown, user: { id: string; email: string } | null) {
	return POST({
		params: {},
		locals: user ? { user } : {},
		url: new URL("http://localhost/api/v1/signing/view"),
		request: new Request("http://localhost/api/v1/signing/view", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
		getClientAddress: () => "203.0.113.1",
	} as never);
}

describe("POST /api/v1/signing/view", () => {
	// A signer id is no credential: signed out, it names nobody.
	test("a signer id without a session is a 404", async () => {
		expect((await call({ signer: "some-signer" }, null)).status).toBe(404);
	});

	test("another account's signer id is a 404, not a 403", async () => {
		const response = await call(
			{ signer: "some-signer" },
			{ id: "someone-else", email: "x@example.com" },
		);
		expect(response.status).toBe(404);
	});

	test("it takes a token or a signer, not both or neither", async () => {
		expect((await call({}, null)).status).toBe(422);
		expect((await call({ token: "a", signer: "b" }, null)).status).toBe(422);
	});
});
