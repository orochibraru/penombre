import {
	afterEach,
	beforeEach,
	describe,
	expect,
	type Mock,
	mock,
	spyOn,
	test,
} from "bun:test";

import { envProvided, getConfig } from "#lib/server/config.js";

import { Email, type SmtpConfig } from "./email";

const mockGetConfig = getConfig as Mock<typeof getConfig>;
const mockEnvProvided = envProvided as Mock<typeof envProvided>;

const smtp: SmtpConfig = {
	enabled: true,
	host: "smtp.invalid",
	port: 587,
	user: "mailer",
	password: "hunter2",
	from: "no-reply@x.test",
	secure: false,
};

const message = {
	to: "ada@x.test",
	subject: "Hello",
	content: "Plain text",
};

function transportOptions(email: Email): Record<string, unknown> {
	return (email.transporter as unknown as { options: Record<string, unknown> })
		.options;
}

describe("new Email", () => {
	test("sends as the instance's name through the given server", () => {
		const email = new Email(message, smtp);
		expect(email.from).toBe('"Penombre" <no-reply@x.test>');
		expect(email.to).toBe("ada@x.test");
		expect(transportOptions(email)).toEqual({
			host: "smtp.invalid",
			port: 587,
			secure: false,
			auth: { user: "mailer", pass: "hunter2" },
		});
	});

	// A relay that only advertises AUTH refused mail with "Missing credentials".
	test("an unauthenticated relay gets no auth block at all", () => {
		const email = new Email(message, { ...smtp, user: "", password: "" });
		expect(transportOptions(email)).not.toHaveProperty("auth");
	});

	test("a password alone still logs in", () => {
		const email = new Email(message, { ...smtp, user: "" });
		expect(transportOptions(email).auth).toEqual({ user: "", pass: "hunter2" });
	});

	test("refuses disabled SMTP", () => {
		expect(() => new Email(message, { ...smtp, enabled: false })).toThrow(
			"SMTP configuration is not defined or not enabled",
		);
	});

	test("without settings it falls back to the environment's", () => {
		mockGetConfig.mockImplementationOnce(
			() => ({ ...getConfig(), smtp: undefined }) as never,
		);
		expect(() => new Email(message)).toThrow(
			"SMTP configuration is not defined or not enabled",
		);
	});
});

describe("Email.send", () => {
	test("hands the text, and the HTML when there is some, to the transport", async () => {
		const email = new Email({ ...message, html: "<p>Hi</p>" }, smtp);
		const sendMail = mock(() => Promise.resolve({ messageId: "m1" }));
		email.transporter.sendMail = sendMail as never;
		expect(await email.send()).toEqual({ messageId: "m1" } as never);
		expect(sendMail).toHaveBeenCalledWith({
			to: "ada@x.test",
			from: '"Penombre" <no-reply@x.test>',
			subject: "Hello",
			text: "Plain text",
			html: "<p>Hi</p>",
		});
	});

	test("a text-only message sends no html field", async () => {
		const email = new Email(message, smtp);
		const sendMail = mock((_options: Record<string, unknown>) =>
			Promise.resolve({}),
		);
		email.transporter.sendMail = sendMail as never;
		await email.send();
		expect(sendMail.mock.calls[0]?.[0]).not.toHaveProperty("html");
	});
});

describe("Email.create and sendTemplate", () => {
	let config: ReturnType<typeof getConfig>;
	let provided: ReturnType<typeof envProvided>;

	beforeEach(() => {
		config = structuredClone(getConfig());
		provided = structuredClone(envProvided());
		mockEnvProvided.mockImplementation(() => ({ ...provided, smtp: true }));
	});

	afterEach(() => {
		mockGetConfig.mockImplementation(() => structuredClone(config));
		mockEnvProvided.mockImplementation(() => structuredClone(provided));
	});

	test("refuses when no SMTP is configured anywhere", async () => {
		mockGetConfig.mockImplementation(
			() => ({ ...config, smtp: undefined }) as never,
		);
		await expect(Email.create(message)).rejects.toThrow(
			"SMTP is not configured",
		);
	});

	test("lays the content out and sends it with the configured server", async () => {
		mockGetConfig.mockImplementation(() => ({ ...config, smtp }) as never);
		const sent: Email[] = [];
		const send = spyOn(Email.prototype, "send").mockImplementation(function (
			this: Email,
		) {
			sent.push(this);
			return Promise.resolve({} as never);
		});
		try {
			await Email.sendTemplate("ada@x.test", {
				subject: "Shared with you",
				heading: "Shared with you",
				lines: ["Grace shared <Mix> with you."],
			});
		} finally {
			send.mockRestore();
		}
		expect(sent).toHaveLength(1);
		const [email] = sent;
		expect(email?.to).toBe("ada@x.test");
		expect(email?.subject).toBe("Shared with you");
		expect(email?.content).toContain("Grace shared <Mix> with you.");
		expect(email?.html).toContain("Grace shared &lt;Mix&gt; with you.");
		expect(email && transportOptions(email).host).toBe("smtp.invalid");
	});
});
