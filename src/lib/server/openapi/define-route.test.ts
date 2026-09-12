import { describe, expect, test } from "bun:test";
import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
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
