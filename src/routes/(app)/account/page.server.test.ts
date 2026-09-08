import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { fail } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
import { getPenombreConfig } from "$lib/server/config";
import type { UserWithSession } from "$lib/server/db/schema";

const mockGetSession = auth.api.getSession as unknown as Mock<
	typeof auth.api.getSession
>;
const mockUpdateUser = auth.api.updateUser as unknown as Mock<
	typeof auth.api.updateUser
>;
const mockAdminUpdateUser = auth.api.adminUpdateUser as unknown as Mock<
	typeof auth.api.adminUpdateUser
>;
const mockGetPenombreConfig = getPenombreConfig as Mock<
	typeof getPenombreConfig
>;

const { actions, load } = await import("./+page.server");

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

const sessionUser: UserWithSession = {
	user: {
		id: "user-1",
		name: "John Doe",
		email: "john@example.com",
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		image: null,
		role: "user",
		banned: false,
		banReason: null,
		banExpires: null,
	},
	session: {
		id: "session-1",
		expiresAt: new Date(),
		token: "token-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		ipAddress: "127.0.0.1",
		userAgent: "user-agent",
		userId: "user-1",
		impersonatedBy: null,
	},
};

describe("load", () => {
	test("returns undefined", () => {
		const result = load();
		expect(result).toBeUndefined();
	});
});

describe("updateAccount", () => {
	test("returns 400 when both name and email are missing", async () => {
		const result = await actions.updateAccount(createRequest({}) as never);
		expect(result).toEqual(fail(400, { error: "Name and email are required" }));
	});

	test("returns 400 when name is missing", async () => {
		const result = await actions.updateAccount(
			createRequest({ email: "john@example.com" }) as never,
		);
		expect(result).toEqual(fail(400, { error: "Name and email are required" }));
	});

	test("returns 400 when email is missing", async () => {
		const result = await actions.updateAccount(
			createRequest({ name: "John" }) as never,
		);
		expect(result).toEqual(fail(400, { error: "Name and email are required" }));
	});

	test("returns 401 when no session exists", async () => {
		mockGetSession.mockResolvedValueOnce(null);

		const result = await actions.updateAccount(
			createRequest({ name: "John", email: "john@example.com" }) as never,
		);
		expect(result).toEqual(fail(401, { error: "Unauthorized" }));
	});

	test("returns 401 when session has no user", async () => {
		mockGetSession.mockResolvedValueOnce({ session: {}, user: null } as never);

		const result = await actions.updateAccount(
			createRequest({ name: "John", email: "john@example.com" }) as never,
		);
		expect(result).toEqual(fail(401, { error: "Unauthorized" }));
	});

	test("returns success when only name changes", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockUpdateUser.mockResolvedValueOnce({ status: true } as never);

		const result = await actions.updateAccount(
			createRequest({ name: "Jane Doe", email: "john@example.com" }) as never,
		);
		expect(result).toEqual({ success: true });
		expect(mockUpdateUser).toHaveBeenLastCalledWith(
			expect.objectContaining({ body: { name: "Jane Doe" } }),
		);
	});

	test("returns success when name is unchanged", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);

		const result = await actions.updateAccount(
			createRequest({ name: "John Doe", email: "john@example.com" }) as never,
		);
		expect(result).toEqual({ success: true });
	});

	test("returns 400 when email changes but SMTP is disabled", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockGetPenombreConfig.mockReturnValueOnce({ smtp: undefined } as never);

		const result = await actions.updateAccount(
			createRequest({ name: "John Doe", email: "new@example.com" }) as never,
		);
		expect(result).toEqual(
			fail(400, { error: "Email change is not allowed without SMTP enabled" }),
		);
	});

	test("updates email when SMTP is enabled", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockGetPenombreConfig.mockReturnValueOnce({
			smtp: { enabled: true },
		} as never);

		const result = await actions.updateAccount(
			createRequest({ name: "John Doe", email: "new@example.com" }) as never,
		);
		expect(result).toEqual({ success: true });
		expect(mockAdminUpdateUser).toHaveBeenLastCalledWith(
			expect.objectContaining({
				body: {
					userId: "user-1",
					data: { email: "new@example.com", emailVerified: false },
				},
			}),
		);
	});

	test("returns 500 when email update fails", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockGetPenombreConfig.mockReturnValueOnce({
			smtp: { enabled: true },
		} as never);
		mockAdminUpdateUser.mockRejectedValueOnce(new Error("DB error"));

		const result = await actions.updateAccount(
			createRequest({ name: "John Doe", email: "new@example.com" }) as never,
		);
		expect(result).toEqual(
			fail(500, {
				error: "An unexpected error occurred while updating email",
			}),
		);
	});

	test("updates both name and email when SMTP is enabled", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockGetPenombreConfig.mockReturnValueOnce({
			smtp: { enabled: true },
		} as never);
		mockUpdateUser.mockResolvedValueOnce({ status: true } as never);

		const result = await actions.updateAccount(
			createRequest({ name: "Jane Doe", email: "new@example.com" }) as never,
		);
		expect(result).toEqual({ success: true });
		expect(mockAdminUpdateUser).toHaveBeenCalled();
		expect(mockUpdateUser).toHaveBeenCalled();
	});

	test("returns 500 when name update fails", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockUpdateUser.mockResolvedValueOnce({ status: false } as never);

		const result = await actions.updateAccount(
			createRequest({ name: "Jane Doe", email: "john@example.com" }) as never,
		);
		expect(result).toEqual(
			fail(500, { error: "Failed to update account details" }),
		);
	});

	test("returns 500 when name update throws", async () => {
		mockGetSession.mockResolvedValueOnce(sessionUser as never);
		mockUpdateUser.mockRejectedValueOnce(new Error("Network error"));

		const result = await actions.updateAccount(
			createRequest({ name: "Jane Doe", email: "john@example.com" }) as never,
		);
		expect(result).toEqual(
			fail(500, {
				error: "An unexpected error occurred while updating account details",
			}),
		);
	});
});
