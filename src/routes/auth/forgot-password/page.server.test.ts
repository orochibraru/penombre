import type { Mock } from "bun:test";
import { afterEach, describe, expect, test } from "bun:test";

import { fail } from "@sveltejs/kit";

import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { getConfig } from "#lib/server/config.js";

const mockMethods = instanceSignInMethods as Mock<typeof instanceSignInMethods>;
const mockGetConfig = getConfig as Mock<typeof getConfig>;
const methods = (password: boolean) => ({
	password,
	passkey: false,
	magicLink: false,
	emailOtp: false,
});

const { actions, load } = await import("./+page.server");

const api = auth.api as unknown as Record<string, unknown>;
let resets: unknown[];

afterEach(() => {
	delete api.requestPasswordReset;
});

function stubReset(outcome: Promise<unknown> = Promise.resolve({})) {
	resets = [];
	api.requestPasswordReset = (input: unknown) => {
		resets.push(input);
		return outcome;
	};
}

/** SMTP for the next config read, which is the mail check's. */
function mailConfigured() {
	mockGetConfig.mockReturnValueOnce({
		...getConfig(),
		smtp: {
			enabled: true,
			host: "smtp.example",
			port: 587,
			user: "mailer",
			password: "secret",
			from: "drive@example",
			secure: false,
		},
	} as never);
}

function submit(email: string, clientAddress = crypto.randomUUID()) {
	const body = new FormData();
	body.set("email", email);
	return {
		request: new Request("http://localhost/auth/forgot-password", {
			method: "POST",
			body,
		}),
		getClientAddress: () => clientAddress,
	} as never;
}

describe("load", () => {
	test("is not found while password sign-in is off", async () => {
		mockMethods.mockResolvedValueOnce(methods(false));
		await expect(load()).rejects.toMatchObject({ status: 404 });
	});

	test("says whether a link can be mailed", async () => {
		expect(await load()).toEqual({ canMail: false });
		mailConfigured();
		expect(await load()).toEqual({ canMail: true });
	});
});

describe("actions.default", () => {
	test("needs an address", async () => {
		expect(await actions.default(submit("  "))).toEqual(
			fail(400, { error: "INVALID_FORM" }),
		);
	});

	test("without mail it says the link cannot be sent", async () => {
		stubReset();
		expect(await actions.default(submit("A@Example.com"))).toEqual(
			fail(503, { unavailable: true, email: "a@example.com" }),
		);
		expect(resets).toEqual([]);
	});

	test("asks better-auth for a reset link to this instance", async () => {
		stubReset();
		mailConfigured();
		const email = `${crypto.randomUUID()}@example.com`;

		expect(await actions.default(submit(email))).toEqual({ sent: email });
		expect(resets).toEqual([
			{
				body: {
					email,
					redirectTo: "http://localhost:5173/auth/reset-password",
				},
			},
		]);
	});

	test("a failed send answers the same, so the address is not revealed", async () => {
		stubReset(Promise.reject(new Error("No such user")));
		mailConfigured();
		const email = `${crypto.randomUUID()}@example.com`;

		expect(await actions.default(submit(email))).toEqual({ sent: email });
	});

	test("an address asked for too often is throttled", async () => {
		stubReset();
		const email = `${crypto.randomUUID()}@example.com`;
		for (let attempt = 0; attempt < 3; attempt++) {
			mailConfigured();
			expect(await actions.default(submit(email))).toEqual({ sent: email });
		}
		mailConfigured();
		expect(await actions.default(submit(email))).toEqual(
			fail(429, { limited: true, email }),
		);
		expect(resets).toHaveLength(3);
	});
});
