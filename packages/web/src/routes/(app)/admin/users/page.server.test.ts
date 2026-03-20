import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { auth } from "$lib/server/auth";

const mockListUsers = auth.api.listUsers as unknown as Mock<
	typeof auth.api.listUsers
>;

const { load } = await import("./+page.server");

describe("load", () => {
	test("returns users list", async () => {
		const users = {
			users: [
				{ id: "user-1", name: "Alice", email: "alice@example.com" },
				{ id: "user-2", name: "Bob", email: "bob@example.com" },
			],
		};
		mockListUsers.mockResolvedValueOnce(users as never);

		const result = await load({
			request: new Request("http://localhost"),
		} as never);

		expect(result).toEqual({ users });
	});

	test("passes empty query and request headers to listUsers", async () => {
		mockListUsers.mockResolvedValueOnce({ users: [] } as never);

		const request = new Request("http://localhost", {
			headers: { Authorization: "Bearer admin-token" },
		});
		await load({ request } as never);

		expect(mockListUsers).toHaveBeenLastCalledWith({
			query: {},
			headers: request.headers,
		});
	});

	test("throws 500 when listUsers fails", async () => {
		mockListUsers.mockRejectedValueOnce(new Error("Forbidden"));

		expect(
			load({ request: new Request("http://localhost") } as never),
		).rejects.toThrow();
	});
});
