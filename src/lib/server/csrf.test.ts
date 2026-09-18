import { describe, expect, test } from "bun:test";
import type { RequestEvent } from "@sveltejs/kit";
import { csrfHandler } from "./csrf.js";

const APP = "http://app.test";

async function status(method: string, headers: Record<string, string> = {}) {
	const request = new Request(`${APP}/api/v1/drives/1`, { method, headers });
	const event = { request, url: new URL(request.url) } as RequestEvent;
	const res = await csrfHandler({
		event,
		resolve: () => new Response(null, { status: 200 }),
	});
	return res.status;
}

describe("csrfHandler", () => {
	test("refuses a bodiless cross-site mutation", async () => {
		expect(await status("DELETE")).toBe(403);
		expect(await status("DELETE", { origin: "http://evil.test" })).toBe(403);
	});

	test("refuses a cross-site form post", async () => {
		const form = { "content-type": "multipart/form-data; boundary=x" };
		expect(await status("POST", { ...form, origin: "http://evil.test" })).toBe(
			403,
		);
	});

	test("allows same-origin, JSON, reads and API keys", async () => {
		expect(await status("DELETE", { origin: APP })).toBe(200);
		expect(await status("POST", { "content-type": "application/json" })).toBe(
			200,
		);
		expect(await status("GET")).toBe(200);
		expect(await status("DELETE", { "x-api-key": "k" })).toBe(200);
		expect(await status("DELETE", { authorization: "Bearer k" })).toBe(200);
	});
});
