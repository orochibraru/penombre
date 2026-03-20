import type { Mock } from "bun:test";
import { describe, expect, test } from "bun:test";
import { auth } from "$lib/server/auth";

const mockListApiKeys = auth.api.listApiKeys as unknown as Mock<
	typeof auth.api.listApiKeys
>;
const mockListPasskeys = auth.api.listPasskeys as unknown as Mock<
	typeof auth.api.listPasskeys
>;
const mockCreateApiKey = auth.api.createApiKey as unknown as Mock<
	typeof auth.api.createApiKey
>;
const mockChangePassword = auth.api.changePassword as unknown as Mock<
	typeof auth.api.changePassword
>;

const { load, actions } = await import("./+page.server");

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

describe("load", () => {
	test("returns apiKeys and passkeys", async () => {
		const mockKeys = [{ id: "key-1", name: "My Key" }];
		const mockPasskeyList = [{ id: "pk-1", name: "My Passkey" }];
		mockListApiKeys.mockResolvedValueOnce(mockKeys as never);
		mockListPasskeys.mockResolvedValueOnce(mockPasskeyList as never);

		const result = await load({
			request: new Request("http://localhost"),
		} as never);

		expect(result).toEqual({
			apiKeys: mockKeys,
			passkeys: mockPasskeyList,
		});
	});

	test("passes request headers to listApiKeys and listPasskeys", async () => {
		mockListApiKeys.mockResolvedValueOnce([] as never);
		mockListPasskeys.mockResolvedValueOnce([] as never);

		const request = new Request("http://localhost", {
			headers: { Authorization: "Bearer token-123" },
		});
		await load({ request } as never);

		expect(mockListApiKeys).toHaveBeenLastCalledWith({
			headers: request.headers,
		});
		expect(mockListPasskeys).toHaveBeenLastCalledWith({
			headers: request.headers,
		});
	});

	test("propagates error when listApiKeys fails", async () => {
		mockListApiKeys.mockRejectedValueOnce(new Error("Unauthorized"));

		expect(
			load({ request: new Request("http://localhost") } as never),
		).rejects.toThrow("Unauthorized");
	});

	test("propagates error when listPasskeys fails", async () => {
		mockListApiKeys.mockResolvedValueOnce([] as never);
		mockListPasskeys.mockRejectedValueOnce(new Error("Service unavailable"));

		expect(
			load({ request: new Request("http://localhost") } as never),
		).rejects.toThrow("Service unavailable");
	});
});

describe("createApiKey", () => {
	test("returns error when name is missing", async () => {
		const result = await actions.createApiKey(createRequest({}) as never);
		expect(result).toEqual({
			success: false,
			error: "API key name is required.",
		});
	});

	test("returns error when name is empty string", async () => {
		const result = await actions.createApiKey(
			createRequest({ name: "   " }) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "API key name is required.",
		});
	});

	test("returns success with the new API key", async () => {
		mockCreateApiKey.mockResolvedValueOnce({ key: "new-api-key-123" } as never);

		const result = await actions.createApiKey(
			createRequest({ name: "My API Key" }) as never,
		);
		expect(result).toEqual({
			success: true,
			apiKey: "new-api-key-123",
		});
		expect(mockCreateApiKey).toHaveBeenLastCalledWith(
			expect.objectContaining({
				body: { name: "My API Key" },
			}),
		);
	});

	test("returns error when createApiKey throws", async () => {
		mockCreateApiKey.mockRejectedValueOnce(new Error("Rate limited"));

		const result = await actions.createApiKey(
			createRequest({ name: "My Key" }) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "Rate limited",
		});
	});

	test("returns fallback error when exception has no message", async () => {
		mockCreateApiKey.mockRejectedValueOnce(new Error(""));

		const result = await actions.createApiKey(
			createRequest({ name: "My Key" }) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "Failed to create API key.",
		});
	});
});

describe("changePassword", () => {
	test("returns error when all fields are missing", async () => {
		const result = await actions.changePassword(createRequest({}) as never);
		expect(result).toEqual({
			success: false,
			error: "Invalid form submission.",
		});
	});

	test("returns error when only currentPassword is provided", async () => {
		const result = await actions.changePassword(
			createRequest({ currentPassword: "old123" }) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "Invalid form submission.",
		});
	});

	test("returns error when newPasswordConfirm is missing", async () => {
		const result = await actions.changePassword(
			createRequest({
				currentPassword: "old123",
				newPassword: "new123",
			}) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "Invalid form submission.",
		});
	});

	test("returns error when passwords do not match", async () => {
		const result = await actions.changePassword(
			createRequest({
				currentPassword: "old123",
				newPassword: "new123",
				newPasswordConfirm: "different",
			}) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "New passwords do not match.",
		});
	});

	test("returns success when password is changed", async () => {
		mockChangePassword.mockResolvedValueOnce({} as never);

		const result = await actions.changePassword(
			createRequest({
				currentPassword: "old123",
				newPassword: "new123",
				newPasswordConfirm: "new123",
			}) as never,
		);
		expect(result).toEqual({ success: true });
		expect(mockChangePassword).toHaveBeenLastCalledWith(
			expect.objectContaining({
				body: {
					currentPassword: "old123",
					newPassword: "new123",
				},
			}),
		);
	});

	test("returns error when changePassword throws", async () => {
		mockChangePassword.mockRejectedValueOnce(
			new Error("Current password is incorrect"),
		);

		const result = await actions.changePassword(
			createRequest({
				currentPassword: "wrong",
				newPassword: "new123",
				newPasswordConfirm: "new123",
			}) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "Current password is incorrect",
		});
	});

	test("returns fallback error when exception has no message", async () => {
		mockChangePassword.mockRejectedValueOnce(new Error(""));

		const result = await actions.changePassword(
			createRequest({
				currentPassword: "old123",
				newPassword: "new123",
				newPasswordConfirm: "new123",
			}) as never,
		);
		expect(result).toEqual({
			success: false,
			error: "Failed to change password.",
		});
	});
});
