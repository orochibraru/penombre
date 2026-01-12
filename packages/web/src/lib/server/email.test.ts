import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

/**
 * Email unit tests
 *
 * Tests the Email class for sending emails via SMTP.
 * Uses mocked nodemailer transporter and config.
 */

// Store original env values
let originalSmtpEnabled: string | undefined;
let originalSmtpHost: string | undefined;
let originalSmtpPort: string | undefined;
let originalSmtpUser: string | undefined;
let originalSmtpPassword: string | undefined;
let originalSmtpFrom: string | undefined;
let originalSmtpSecure: string | undefined;

// Mock sendMail function
const mockSendMail = mock(() =>
	Promise.resolve({
		messageId: "test-message-id",
		accepted: ["test@example.com"],
		rejected: [],
	}),
);

// Mock createTransport to return a mock transporter
mock.module("nodemailer", () => ({
	createTransport: mock(() => ({
		sendMail: mockSendMail,
	})),
}));

beforeEach(() => {
	// Save original env values
	originalSmtpEnabled = process.env.SMTP_ENABLED;
	originalSmtpHost = process.env.SMTP_HOST;
	originalSmtpPort = process.env.SMTP_PORT;
	originalSmtpUser = process.env.SMTP_USER;
	originalSmtpPassword = process.env.SMTP_PASSWORD;
	originalSmtpFrom = process.env.SMTP_FROM;
	originalSmtpSecure = process.env.SMTP_SECURE;

	// Set SMTP env vars for tests
	process.env.SMTP_ENABLED = "true";
	process.env.SMTP_HOST = "smtp.test.com";
	process.env.SMTP_PORT = "587";
	process.env.SMTP_USER = "testuser";
	process.env.SMTP_PASSWORD = "testpass";
	process.env.SMTP_FROM = "noreply@test.com";
	process.env.SMTP_SECURE = "false";

	// Reset mock
	mockSendMail.mockClear();
});

afterEach(() => {
	// Restore original env values
	if (originalSmtpEnabled !== undefined) {
		process.env.SMTP_ENABLED = originalSmtpEnabled;
	} else {
		delete process.env.SMTP_ENABLED;
	}
	if (originalSmtpHost !== undefined) {
		process.env.SMTP_HOST = originalSmtpHost;
	} else {
		delete process.env.SMTP_HOST;
	}
	if (originalSmtpPort !== undefined) {
		process.env.SMTP_PORT = originalSmtpPort;
	} else {
		delete process.env.SMTP_PORT;
	}
	if (originalSmtpUser !== undefined) {
		process.env.SMTP_USER = originalSmtpUser;
	} else {
		delete process.env.SMTP_USER;
	}
	if (originalSmtpPassword !== undefined) {
		process.env.SMTP_PASSWORD = originalSmtpPassword;
	} else {
		delete process.env.SMTP_PASSWORD;
	}
	if (originalSmtpFrom !== undefined) {
		process.env.SMTP_FROM = originalSmtpFrom;
	} else {
		delete process.env.SMTP_FROM;
	}
	if (originalSmtpSecure !== undefined) {
		process.env.SMTP_SECURE = originalSmtpSecure;
	} else {
		delete process.env.SMTP_SECURE;
	}
});

describe("Email - Constructor", () => {
	it("should create Email instance with valid SMTP config", async () => {
		const { Email } = await import("./email");

		const email = new Email({
			to: "recipient@example.com",
			subject: "Test Subject",
			content: "Test content",
		});

		expect(email.to).toBe("recipient@example.com");
		expect(email.subject).toBe("Test Subject");
		expect(email.content).toBe("Test content");
		expect(email.from).toBe("noreply@test.com");
	});

	it("should throw when SMTP is not enabled", async () => {
		process.env.SMTP_ENABLED = "false";

		// Need to reimport to get fresh config
		const { Email } = await import("./email");

		expect(() => {
			new Email({
				to: "recipient@example.com",
				subject: "Test",
				content: "Test",
			});
		}).toThrow("SMTP configuration is not defined or not enabled");
	});

	it("should throw when SMTP config is missing", async () => {
		delete process.env.SMTP_ENABLED;
		delete process.env.SMTP_HOST;

		const { Email } = await import("./email");

		expect(() => {
			new Email({
				to: "recipient@example.com",
				subject: "Test",
				content: "Test",
			});
		}).toThrow();
	});
});

describe("Email - send()", () => {
	it("should call transporter.sendMail with correct params", async () => {
		const { Email } = await import("./email");

		const email = new Email({
			to: "recipient@example.com",
			subject: "Test Subject",
			content: "Test content body",
		});

		await email.send();

		expect(mockSendMail).toHaveBeenCalledTimes(1);
		expect(mockSendMail).toHaveBeenCalledWith({
			to: "recipient@example.com",
			from: "noreply@test.com",
			subject: "Test Subject",
			text: "Test content body",
		});
	});

	it("should return sendMail result", async () => {
		const { Email } = await import("./email");

		const email = new Email({
			to: "recipient@example.com",
			subject: "Test",
			content: "Test",
		});

		const result = await email.send();

		expect(result.messageId).toBe("test-message-id");
		expect(result.accepted).toContain("test@example.com");
	});

	it("should propagate sendMail errors", async () => {
		mockSendMail.mockRejectedValueOnce(new Error("SMTP connection failed"));

		const { Email } = await import("./email");

		const email = new Email({
			to: "recipient@example.com",
			subject: "Test",
			content: "Test",
		});

		await expect(email.send()).rejects.toThrow("SMTP connection failed");
	});
});
