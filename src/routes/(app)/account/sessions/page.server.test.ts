import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { auth } from "$lib/server/auth";

const mockListSessions = auth.api.listSessions as unknown as Mock<
	typeof auth.api.listSessions
>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns sessions list", async () => {
		const sessions = [
			{ id: "sess-1", userId: "user-1", token: "tok-1" },
			{ id: "sess-2", userId: "user-1", token: "tok-2" },
		];
		mockListSessions.mockResolvedValueOnce(sessions as never);

		const result = await load({
			request: new Request("http://localhost"),
		} as never);

		expect(result).toEqual({ sessions });
	});

	test("passes request headers to listSessions", async () => {
		mockListSessions.mockResolvedValueOnce([] as never);

		const request = new Request("http://localhost", {
			headers: { Authorization: "Bearer token-123" },
		});
		await load({ request } as never);

		expect(mockListSessions).toHaveBeenLastCalledWith({
			headers: request.headers,
		});
	});

	test("throws 500 when listSessions fails", async () => {
		mockListSessions.mockRejectedValueOnce(new Error("DB error"));

		expect(
			load({ request: new Request("http://localhost") } as never),
		).rejects.toThrow();
	});
});
