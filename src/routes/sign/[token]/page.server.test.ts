import { describe, expect, test } from "bun:test";

const { load, actions } = await import("./+page.server");

function event(form: Record<string, string> = {}) {
	const body = new FormData();
	for (const [key, value] of Object.entries(form)) {
		body.append(key, value);
	}
	return {
		params: { token: "no-such-token" },
		locals: {},
		request: new Request("http://localhost/sign/no-such-token?/sign", {
			method: "POST",
			body,
		}),
		getClientAddress: () => "203.0.113.1",
	} as never;
}

describe("/sign/[token]", () => {
	test("an unknown link is a 404 page", async () => {
		await expect(load(event())).rejects.toMatchObject({ status: 404 });
	});

	// An action runs without the load: it must check the token itself.
	test("a bare POST with an unknown token signs nothing", async () => {
		const signed = await actions.sign(
			event({ signature: "data:image/png;base64,AAAA", consent: "on" }),
		);
		expect(signed).toMatchObject({ status: 404 });
		const declined = await actions.decline(event({ reason: "no" }));
		expect(declined).toMatchObject({ status: 404 });
	});
});
