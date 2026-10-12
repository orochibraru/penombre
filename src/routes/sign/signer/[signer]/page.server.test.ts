import { describe, expect, test } from "bun:test";

const { load, actions } = await import("./+page.server");

function event(user: { id: string; email: string } | null) {
	return {
		params: { signer: "some-signer" },
		locals: user ? { user } : {},
		url: new URL("http://localhost/sign/signer/some-signer"),
		request: new Request("http://localhost/sign/signer/some-signer?/sign", {
			method: "POST",
			body: new FormData(),
		}),
		getClientAddress: () => "203.0.113.1",
	} as never;
}

describe("/sign/signer/[signer]", () => {
	test("signed out, it goes to sign-in and back", async () => {
		await expect(load(event(null))).rejects.toMatchObject({
			status: 303,
			location: "/auth/sign-in?next=%2Fsign%2Fsigner%2Fsome-signer",
		});
	});

	// Someone else's row, or none: the same 404, never a 403.
	test("another account finds nothing", async () => {
		await expect(
			load(event({ id: "someone-else", email: "x@example.com" })),
		).rejects.toMatchObject({ status: 404 });
	});

	test("an action signs nothing without the signer's session", async () => {
		expect(await actions.sign(event(null))).toMatchObject({ status: 404 });
		expect(await actions.decline(event(null))).toMatchObject({ status: 404 });
	});
});
