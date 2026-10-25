import { describe, expect, test } from "bun:test";

import { ReadOnlyVolumeError } from "./errors";
import { Http } from "./http";

async function answer(response: Response) {
	return { status: response.status, body: await response.json() };
}

describe("Http success responses", () => {
	test("Ok wraps the payload in data", async () => {
		expect(await answer(Http.Ok({ id: "f1" }))).toEqual({
			status: 200,
			body: { data: { id: "f1" } },
		});
	});

	test("Accepted and Created answer an empty envelope", async () => {
		expect(await answer(Http.Accepted())).toEqual({ status: 202, body: {} });
		expect(await answer(Http.Created())).toEqual({ status: 201, body: {} });
	});

	test("Deleted is a 204", () => {
		expect(Http.Deleted().status).toBe(204);
	});

	test("StandardizedResponse keeps the given init", async () => {
		const response = Http.StandardizedResponse(
			{ message: "hi" },
			{ status: 418, headers: { "x-test": "1" } },
		);
		expect(response.headers.get("x-test")).toBe("1");
		expect(await answer(response)).toEqual({
			status: 418,
			body: { message: "hi" },
		});
	});
});

describe("Http error responses", () => {
	test("each error carries its status, message and context", async () => {
		const cases: [Response, number, string][] = [
			[Http.Unauthorized({ why: "a" }), 401, "Unauthorized"],
			[Http.Forbidden({ why: "a" }), 403, "Forbidden"],
			[Http.BadRequest("Bad name", { why: "a" }), 400, "Bad name"],
			[Http.NotFound("No file", { why: "a" }), 404, "No file"],
			[Http.Conflict("Taken", { why: "a" }), 409, "Taken"],
			[Http.UnprocessableEntity("Invalid", { why: "a" }), 422, "Invalid"],
			[Http.TooManyRequests("Slow down", { why: "a" }), 429, "Slow down"],
			[Http.NotImplemented({ why: "a" }), 501, "Not implemented"],
			[Http.ServiceUnavailable({ why: "a" }), 503, "Service unavailable"],
		];
		for (const [response, status, message] of cases) {
			expect(await answer(response)).toEqual({
				status,
				body: { message, context: { why: "a" } },
			});
		}
	});

	test("NotFound and TooManyRequests have default messages", async () => {
		expect((await answer(Http.NotFound())).body).toEqual({
			message: "Not found",
		});
		expect((await answer(Http.TooManyRequests())).body).toEqual({
			message: "Too many requests",
		});
	});
});

describe("Http.ServerError", () => {
	// A Drizzle error carries the failed SQL and its bound params.
	test("never sends the error's own message, only an id for the log", async () => {
		const { status, body } = await answer(
			Http.ServerError(
				"Could not list files",
				new Error("select * from files where owner = 'secret'"),
			),
		);
		expect(status).toBe(500);
		expect(body.message).toBe("Could not list files");
		expect(body.context.errorId).toMatch(/^[0-9a-f-]{36}$/);
		expect(JSON.stringify(body)).not.toContain("secret");
	});

	test("a unique violation is the caller's conflict", async () => {
		const duplicate = new Error("Failed query", {
			cause: Object.assign(new Error("dup"), { code: "23505" }),
		});
		expect(await answer(Http.ServerError("Restore failed", duplicate))).toEqual(
			{
				status: 409,
				body: { message: "Something with that name already exists here." },
			},
		);
	});

	test("a read-only refusal is a 403 with its message", async () => {
		expect(
			await answer(
				Http.ServerError("Save failed", new ReadOnlyVolumeError("view only")),
			),
		).toEqual({
			status: 403,
			body: { message: "Forbidden", context: "view only" },
		});
	});
});
