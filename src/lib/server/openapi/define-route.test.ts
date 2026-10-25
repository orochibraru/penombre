import { describe, expect, test } from "bun:test";

import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";

import {
	DriveAccessError,
	ReadOnlyVolumeError,
	StorageUnavailableError,
	VersioningDisabledError,
	VersionMergeError,
} from "#lib/server/errors.js";

import { defineRoute } from "./define-route";

/** The service factory hands back whatever user it was given. */
const route = defineRoute({
	method: "get",
	path: "/api/v1/test/storage-owner",
	summary: "Test route",
	tags: ["Test"],
	response: z.object({}),
	service: (user) => user,
});

const handler = route.handler(({ service, user }) =>
	Promise.resolve(
		Response.json({ service: service.id, user: user.id }) as Response,
	),
);

function eventFor(locals: Partial<App.Locals>): RequestEvent {
	return {
		locals,
		url: new URL("http://localhost/api/v1/test/storage-owner"),
		request: new Request("http://localhost/api/v1/test/storage-owner"),
		params: {},
	} as unknown as RequestEvent;
}

const sessionUser = { id: "session-user" } as NonNullable<App.Locals["user"]>;
const sharedOwner = { id: "shared-owner" } as NonNullable<App.Locals["user"]>;

describe("route service owner", () => {
	// Simple mode routes every account through one shared owner. Building the
	// service from the session user instead gave each account a drive of its
	// own, so the shared drive was not shared.
	test("builds the service from the storage owner", async () => {
		const res = await handler(
			eventFor({ user: sessionUser, storageOwner: sharedOwner }),
		);

		expect(await res.json()).toEqual({
			service: "shared-owner",
			user: "session-user",
		});
	});

	test("falls back to the session user", async () => {
		const res = await handler(eventFor({ user: sessionUser }));

		expect(await res.json()).toEqual({
			service: "session-user",
			user: "session-user",
		});
	});

	test("401s with no user at all", async () => {
		expect((await handler(eventFor({}))).status).toBe(401);
	});
});

function requestFor(
	locals: Partial<App.Locals>,
	options: {
		params?: Record<string, string>;
		search?: string;
		method?: string;
		body?: string;
	} = {},
): RequestEvent {
	const url = new URL(
		`http://localhost/api/v1/test/validated${options.search ?? ""}`,
	);
	return {
		locals,
		url,
		request: new Request(url, {
			method: options.method ?? "GET",
			body: options.body,
		}),
		params: options.params ?? {},
	} as unknown as RequestEvent;
}

const validated = defineRoute({
	method: "post",
	path: "/api/v1/test/validated",
	response: z.object({}),
	params: z.object({ id: z.string().uuid() }),
	query: z.object({ limit: z.coerce.number().int().positive().optional() }),
	body: z.object({ name: z.string().min(1).optional() }),
});

const echo = validated.handler(({ params, query, body }) =>
	Response.json({ params, query, body }),
);

const id = "3f1c8a52-6a8b-4c3e-9d7e-2f4b5a6c7d8e";

describe("request validation", () => {
	test("hands the parsed params, query and body to the handler", async () => {
		const response = await echo(
			requestFor(
				{ user: sessionUser },
				{
					params: { id },
					search: "?limit=20",
					method: "POST",
					body: JSON.stringify({ name: "Mix" }),
				},
			),
		);
		expect(await response.json()).toEqual({
			params: { id },
			query: { limit: 20 },
			body: { name: "Mix" },
		});
	});

	test("bad path parameters are a 400 naming the field", async () => {
		const response = await echo(
			requestFor({ user: sessionUser }, { params: { id: "nope" } }),
		);
		expect(response.status).toBe(400);
		expect((await response.json()).message).toStartWith(
			"Invalid path parameters: id:",
		);
	});

	test("bad query parameters are a 400 naming the field", async () => {
		const response = await echo(
			requestFor(
				{ user: sessionUser },
				{ params: { id }, search: "?limit=-1" },
			),
		);
		expect(response.status).toBe(400);
		expect((await response.json()).message).toStartWith(
			"Invalid query parameters: limit:",
		);
	});

	test("a body that fails its schema is a 422", async () => {
		const response = await echo(
			requestFor(
				{ user: sessionUser },
				{ params: { id }, method: "POST", body: JSON.stringify({ name: "" }) },
			),
		);
		expect(response.status).toBe(422);
		expect((await response.json()).message).toStartWith(
			"Invalid request body: name:",
		);
	});

	// A bodiless DELETE must still reach a route whose fields are optional.
	test("a missing or unreadable body is read as an empty object", async () => {
		const response = await echo(
			requestFor(
				{ user: sessionUser },
				{ params: { id }, method: "POST", body: "not json" },
			),
		);
		expect((await response.json()).body).toEqual({});
	});

	test("a form-data route parses its own body", async () => {
		const upload = defineRoute({
			method: "post",
			path: "/api/v1/test/form",
			response: z.object({}),
			body: z.object({ file: z.string() }),
			isFormData: true,
		}).handler(({ body }) => Response.json({ parsed: body ?? null }));
		const response = await upload(
			requestFor({ user: sessionUser }, { method: "POST", body: "raw" }),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ parsed: null });
	});

	test("a public route runs with no user and no service", async () => {
		const open = defineRoute({
			method: "get",
			path: "/api/v1/test/public",
			response: z.object({}),
			requireAuth: false,
			service: () => "built",
		}).handler(({ service }) => Response.json({ service: service ?? null }));
		expect(await (await open(requestFor({}))).json()).toEqual({
			service: null,
		});
	});
});

describe("refusals", () => {
	function failingWith(error: unknown) {
		return defineRoute({
			method: "get",
			path: "/api/v1/test/refusal",
			response: z.object({}),
		}).handler(() => {
			throw error;
		});
	}

	async function answer(error: unknown) {
		const response = await failingWith(error)(
			requestFor({ user: sessionUser }),
		);
		return {
			status: response.status,
			message: (await response.json()).message,
		};
	}

	test("each refusal answers with its own status", async () => {
		expect(await answer(new DriveAccessError(404, "No such drive"))).toEqual({
			status: 404,
			message: "No such drive",
		});
		expect(
			(await answer(new DriveAccessError(403, "Viewers cannot write"))).status,
		).toBe(403);
		expect((await answer(new ReadOnlyVolumeError())).status).toBe(403);
		expect((await answer(new VersioningDisabledError())).status).toBe(403);
		expect(await answer(new VersionMergeError("One file only"))).toEqual({
			status: 409,
			message: "One file only",
		});
		expect((await answer(new StorageUnavailableError("/mnt"))).status).toBe(
			503,
		);
	});

	test("a refusal from the service factory is answered too", async () => {
		const guarded = defineRoute({
			method: "get",
			path: "/api/v1/test/guarded",
			response: z.object({}),
			service: () => Promise.reject(new DriveAccessError(404, "No such drive")),
		}).handler(() => Response.json({ reached: true }));
		const response = await guarded(requestFor({ user: sessionUser }));
		expect(response.status).toBe(404);
	});

	test("anything else is rethrown for SvelteKit to handle", async () => {
		const boom = new Error("boom");
		await expect(
			failingWith(boom)(requestFor({ user: sessionUser })),
		).rejects.toBe(boom);
	});
});
