import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	mock,
	test,
} from "bun:test";

import { auth, instanceSignInMethods } from "#lib/server/auth/index.js";
import { envProvided, getConfig } from "#lib/server/config.js";

import { canMailPasswordLinks, requestPasswordLink } from "./password-link";

const mockGetConfig = getConfig as Mock<typeof getConfig>;
const mockEnvProvided = envProvided as Mock<typeof envProvided>;
const mockMethods = instanceSignInMethods as Mock<typeof instanceSignInMethods>;

const api = auth.api as typeof auth.api & {
	requestPasswordReset?: Mock<(input: unknown) => Promise<unknown>>;
};

const smtp = {
	enabled: true,
	host: "smtp.invalid",
	port: 587,
	user: "",
	password: "",
	from: "no-reply@x.test",
	secure: false,
};

let config: ReturnType<typeof getConfig>;
let provided: ReturnType<typeof envProvided>;

function passwordSignIn(password: boolean) {
	mockMethods.mockImplementationOnce(() =>
		Promise.resolve({
			password,
			passkey: true,
			magicLink: false,
			emailOtp: false,
		}),
	);
}

function smtpConfigured(configured: boolean) {
	mockGetConfig.mockImplementation(
		() => ({ ...config, smtp: configured ? smtp : undefined }) as never,
	);
}

/** Rate-limit counters live for the process, so every test needs its own keys. */
function fresh() {
	const id = crypto.randomUUID();
	return { email: `${id}@x.test`, address: `10.0.${id}` };
}

beforeEach(() => {
	config = structuredClone(getConfig());
	provided = structuredClone(envProvided());
	mockEnvProvided.mockImplementation(() => ({ ...provided, smtp: true }));
	api.requestPasswordReset = mock(() => Promise.resolve({ status: true }));
});

afterEach(() => {
	mockGetConfig.mockImplementation(() => structuredClone(config));
	mockEnvProvided.mockImplementation(() => structuredClone(provided));
});

afterAll(() => {
	delete api.requestPasswordReset;
});

describe("canMailPasswordLinks", () => {
	test("needs password sign-in and a mail server", async () => {
		smtpConfigured(true);
		passwordSignIn(true);
		expect(await canMailPasswordLinks()).toBe(true);
		passwordSignIn(false);
		expect(await canMailPasswordLinks()).toBe(false);
		smtpConfigured(false);
		passwordSignIn(true);
		expect(await canMailPasswordLinks()).toBe(false);
	});
});

describe("requestPasswordLink", () => {
	test("without mail nothing is sent", async () => {
		smtpConfigured(false);
		passwordSignIn(true);
		const { email, address } = fresh();
		expect(await requestPasswordLink(email, address)).toBe("unavailable");
		expect(api.requestPasswordReset).not.toHaveBeenCalled();
	});

	test("mails a reset link that lands on this instance", async () => {
		smtpConfigured(true);
		passwordSignIn(true);
		const { email, address } = fresh();
		expect(await requestPasswordLink(email, address)).toBe("sent");
		expect(api.requestPasswordReset).toHaveBeenCalledWith({
			body: {
				email,
				redirectTo: `${config.origin}/auth/reset-password`,
			},
		});
	});

	// The answer must not reveal whether the address has an account.
	test("a send that fails still answers sent", async () => {
		smtpConfigured(true);
		passwordSignIn(true);
		api.requestPasswordReset = mock(() =>
			Promise.reject(new Error("relay refused")),
		);
		const { email, address } = fresh();
		expect(await requestPasswordLink(email, address)).toBe("sent");
	});

	test("one address gets three links per window", async () => {
		smtpConfigured(true);
		const { email } = fresh();
		for (let index = 0; index < 3; index++) {
			passwordSignIn(true);
			expect(await requestPasswordLink(email, fresh().address)).toBe("sent");
		}
		passwordSignIn(true);
		expect(await requestPasswordLink(email, fresh().address)).toBe("limited");
		expect(api.requestPasswordReset).toHaveBeenCalledTimes(3);
	});

	test("one client gets ten requests per window", async () => {
		smtpConfigured(true);
		const { address } = fresh();
		for (let index = 0; index < 10; index++) {
			passwordSignIn(true);
			expect(await requestPasswordLink(fresh().email, address)).toBe("sent");
		}
		passwordSignIn(true);
		expect(await requestPasswordLink(fresh().email, address)).toBe("limited");
	});
});
