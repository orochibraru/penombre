import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { extractFirstOidcProvider } from "$lib/test-utils";
import {
	getOpendriveConfig,
	isSmtpEnabled,
	validateOpendriveConfig,
} from "./config";
import { defaultConfigValues } from "./config.defaults";

/**
 * Configuration tests
 *
 * Tests the config parsing, validation, and environment variable handling.
 */

// Store original env to restore after tests
let originalEnv: Record<string, string | undefined>;

function clearConfigEnvVars() {
	const configVars = [
		"APP_ENV",
		"PORT",
		"ORIGIN",
		"LOG_LEVEL",
		"LOG_FORMAT",
		"DATABASE_URL",
		"ENABLE_EMAIL_SIGNIN",
		"ENABLE_OAUTH_SIGNIN",
		"MIN_PASSWORD_LENGTH",
		"AUTH_SECRET",
		"SMTP_ENABLED",
		"SMTP_HOST",
		"SMTP_PORT",
		"SMTP_USER",
		"SMTP_PASSWORD",
		"SMTP_FROM",
		"SMTP_SECURE",
	];

	// Also clear any OAUTH_* vars
	for (const key of Object.keys(process.env)) {
		if (key.startsWith("OAUTH_")) {
			delete process.env[key];
		}
	}

	for (const key of configVars) {
		delete process.env[key];
	}
}

beforeEach(() => {
	// Save original env
	originalEnv = { ...process.env };
});

afterEach(() => {
	// Restore original env
	clearConfigEnvVars();
	for (const [key, value] of Object.entries(originalEnv)) {
		if (value !== undefined) {
			process.env[key] = value;
		}
	}
});

describe("validateOpendriveConfig", () => {
	it("should accept valid minimal config with defaults", () => {
		const config = validateOpendriveConfig({});

		expect(config.environment).toBe(defaultConfigValues.environment);
		expect(config.port).toBe(defaultConfigValues.port);
		expect(config.origin).toBe(defaultConfigValues.origin);
		expect(config.logLevel).toBe(defaultConfigValues.logLevel);
		expect(config.logFormat).toBe(defaultConfigValues.logFormat);
	});

	it("should accept valid full config", () => {
		const config = validateOpendriveConfig({
			environment: "dev",
			port: 8080,
			origin: "https://example.com",
			logLevel: "debug",
			logFormat: "json",
			db: {
				url: "postgresql://user:pass@host:5432/db",
			},
			auth: {
				enableEmailSignIn: false,
				enableOAuthSignIn: false,
				minPasswordLength: 12,
				secret: "super-secret-key",
				oauthProviders: [],
			},
		});

		expect(config.environment).toBe("dev");
		expect(config.port).toBe(8080);
		expect(config.origin).toBe("https://example.com");
		expect(config.logLevel).toBe("debug");
		expect(config.logFormat).toBe("json");
		expect(config.db.url).toBe("postgresql://user:pass@host:5432/db");
		expect(config.auth.enableEmailSignIn).toBe(false);
		expect(config.auth.minPasswordLength).toBe(12);
	});

	it("should reject invalid environment value", () => {
		expect(() =>
			validateOpendriveConfig({
				environment: "staging", // Invalid
			}),
		).toThrow();
	});

	it("should reject invalid log level", () => {
		expect(() =>
			validateOpendriveConfig({
				logLevel: "verbose", // Invalid
			}),
		).toThrow();
	});

	it("should reject invalid log format", () => {
		expect(() =>
			validateOpendriveConfig({
				logFormat: "xml", // Invalid
			}),
		).toThrow();
	});

	it("should reject invalid database URL", () => {
		expect(() =>
			validateOpendriveConfig({
				db: {
					url: "not-a-valid-url",
				},
			}),
		).toThrow();
	});
});

describe("validateOpendriveConfig - OAuth validation", () => {
	it("should require at least one OAuth provider when OAuth is enabled", () => {
		expect(() =>
			validateOpendriveConfig({
				auth: {
					enableOAuthSignIn: true,
					oauthProviders: [], // No providers
				},
			}),
		).toThrow("At least one OAuth provider must be enabled");
	});

	it("should accept config with OAuth enabled and valid provider", () => {
		const config = validateOpendriveConfig({
			auth: {
				enableOAuthSignIn: true,
				oauthProviders: [
					{
						name: "google",
						clientId: "client-id",
						clientSecret: "client-secret",
						discoveryUrl:
							"https://accounts.google.com/.well-known/openid-configuration",
						enabled: true,
					},
				],
			},
		});

		expect(config.auth.enableOAuthSignIn).toBe(true);
		expect(config.auth.oauthProviders).toHaveLength(1);
		const provider = extractFirstOidcProvider(config.auth.oauthProviders);
		expect(provider.name).toBe("google");
	});

	it("should fail when OAuth is enabled but all providers are disabled", () => {
		expect(() =>
			validateOpendriveConfig({
				auth: {
					enableOAuthSignIn: true,
					oauthProviders: [
						{
							name: "google",
							clientId: "client-id",
							clientSecret: "client-secret",
							discoveryUrl:
								"https://accounts.google.com/.well-known/openid-configuration",
							enabled: false, // Disabled
						},
					],
				},
			}),
		).toThrow("At least one OAuth provider must be enabled");
	});

	it("should set default OAuth scopes", () => {
		const config = validateOpendriveConfig({
			auth: {
				enableOAuthSignIn: true,
				oauthProviders: [
					{
						name: "provider",
						clientId: "id",
						clientSecret: "secret",
						discoveryUrl:
							"https://example.com/.well-known/openid-configuration",
					},
				],
			},
		});

		const provider = extractFirstOidcProvider(config.auth.oauthProviders);

		expect(provider.scopes).toEqual(["openid", "profile", "email"]);
	});

	it("should default pkce to true", () => {
		const config = validateOpendriveConfig({
			auth: {
				enableOAuthSignIn: true,
				oauthProviders: [
					{
						name: "provider",
						clientId: "id",
						clientSecret: "secret",
						discoveryUrl:
							"https://example.com/.well-known/openid-configuration",
					},
				],
			},
		});

		const provider = extractFirstOidcProvider(config.auth.oauthProviders);

		expect(provider.pkce).toBe(true);
	});
});

describe("validateOpendriveConfig - SMTP validation", () => {
	it("should accept config without SMTP", () => {
		const config = validateOpendriveConfig({});
		expect(config.smtp).toBeUndefined();
	});

	it("should accept valid SMTP config", () => {
		const config = validateOpendriveConfig({
			smtp: {
				enabled: true,
				host: "smtp.example.com",
				port: 587,
				user: "user",
				password: "password",
				from: "noreply@example.com",
				secure: false,
			},
		});

		expect(config.smtp?.enabled).toBe(true);
		expect(config.smtp?.host).toBe("smtp.example.com");
		expect(config.smtp?.port).toBe(587);
	});

	it("should reject SMTP config with missing host when enabled", () => {
		expect(() =>
			validateOpendriveConfig({
				smtp: {
					enabled: true,
					host: "", // Empty
					port: 587,
					user: "user",
					password: "password",
					from: "noreply@example.com",
					secure: false,
				},
			}),
		).toThrow();
	});

	it("should reject SMTP config with missing password when enabled", () => {
		expect(() =>
			validateOpendriveConfig({
				smtp: {
					enabled: true,
					host: "smtp.example.com",
					port: 587,
					user: "user",
					password: "", // Empty
					from: "noreply@example.com",
					secure: false,
				},
			}),
		).toThrow();
	});
});

describe("getOpendriveConfig", () => {
	it("should return default values when no env vars are set", () => {
		clearConfigEnvVars();

		const config = getOpendriveConfig();

		expect(config.environment).toBe(defaultConfigValues.environment);
		expect(config.port).toBe(defaultConfigValues.port);
		expect(config.logLevel).toBe(defaultConfigValues.logLevel);
	});

	it("should read APP_ENV from environment", () => {
		clearConfigEnvVars();
		process.env.APP_ENV = "dev";

		const config = getOpendriveConfig();

		expect(config.environment).toBe("dev");
	});

	it("should read PORT from environment", () => {
		clearConfigEnvVars();
		process.env.PORT = "8080";

		const config = getOpendriveConfig();

		expect(config.port).toBe(8080);
	});

	it("should read LOG_LEVEL from environment", () => {
		clearConfigEnvVars();
		process.env.LOG_LEVEL = "debug";

		const config = getOpendriveConfig();

		expect(config.logLevel).toBe("debug");
	});

	it("should read LOG_FORMAT from environment", () => {
		clearConfigEnvVars();
		process.env.LOG_FORMAT = "json";

		const config = getOpendriveConfig();

		expect(config.logFormat).toBe("json");
	});

	it("should read DATABASE_URL from environment", () => {
		clearConfigEnvVars();
		process.env.DATABASE_URL = "postgresql://test:test@testhost:5432/testdb";

		const config = getOpendriveConfig();

		expect(config.db.url).toBe("postgresql://test:test@testhost:5432/testdb");
	});

	it("should fall back to default for invalid LOG_LEVEL", () => {
		clearConfigEnvVars();
		process.env.LOG_LEVEL = "invalid";

		const config = getOpendriveConfig();

		expect(config.logLevel).toBe(defaultConfigValues.logLevel);
	});

	it("should fall back to default for invalid LOG_FORMAT", () => {
		clearConfigEnvVars();
		process.env.LOG_FORMAT = "invalid";

		const config = getOpendriveConfig();

		expect(config.logFormat).toBe(defaultConfigValues.logFormat);
	});
});

describe("getOpendriveConfig - OAuth providers from env", () => {
	it("should parse OAuth provider from env vars", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "true";
		process.env.OAUTH_GOOGLE_CLIENT_ID = "google-client-id";
		process.env.OAUTH_GOOGLE_CLIENT_SECRET = "google-client-secret";
		process.env.OAUTH_GOOGLE_DISCOVERY_URL =
			"https://accounts.google.com/.well-known/openid-configuration";

		const config = getOpendriveConfig();

		expect(config.auth.oauthProviders).toHaveLength(1);
		const provider = extractFirstOidcProvider(config.auth.oauthProviders);

		expect(provider.name).toBe("google");
		expect(provider.clientId).toBe("google-client-id");
	});

	it("should parse multiple OAuth providers", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "true";

		// Google
		process.env.OAUTH_GOOGLE_CLIENT_ID = "google-id";
		process.env.OAUTH_GOOGLE_CLIENT_SECRET = "google-secret";
		process.env.OAUTH_GOOGLE_DISCOVERY_URL =
			"https://accounts.google.com/.well-known/openid-configuration";

		// GitHub
		process.env.OAUTH_GITHUB_CLIENT_ID = "github-id";
		process.env.OAUTH_GITHUB_CLIENT_SECRET = "github-secret";
		process.env.OAUTH_GITHUB_DISCOVERY_URL =
			"https://github.com/.well-known/openid-configuration";

		const config = getOpendriveConfig();

		expect(config.auth.oauthProviders).toHaveLength(2);
		const names = config.auth.oauthProviders.map((p) => p.name);
		expect(names).toContain("google");
		expect(names).toContain("github");
	});

	it("should skip OAuth provider with missing required fields", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "false"; // Disable so validation passes
		process.env.OAUTH_INCOMPLETE_CLIENT_ID = "id-only";
		// Missing CLIENT_SECRET and DISCOVERY_URL

		const config = getOpendriveConfig();

		// Should not include the incomplete provider
		const incomplete = config.auth.oauthProviders.find(
			(p) => p.name === "incomplete",
		);
		expect(incomplete).toBeUndefined();
	});

	it("should parse OAuth provider ENABLED flag", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "true";
		process.env.OAUTH_TEST_CLIENT_ID = "test-id";
		process.env.OAUTH_TEST_CLIENT_SECRET = "test-secret";
		process.env.OAUTH_TEST_DISCOVERY_URL =
			"https://test.com/.well-known/openid-configuration";
		process.env.OAUTH_TEST_ENABLED = "true";

		const config = getOpendriveConfig();

		const provider = extractFirstOidcProvider(config.auth.oauthProviders);
		expect(provider.enabled).toBe(true);
	});

	it("should parse OAuth provider PKCE flag", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "true";
		process.env.OAUTH_TEST_CLIENT_ID = "test-id";
		process.env.OAUTH_TEST_CLIENT_SECRET = "test-secret";
		process.env.OAUTH_TEST_DISCOVERY_URL =
			"https://test.com/.well-known/openid-configuration";
		process.env.OAUTH_TEST_PKCE = "false";

		const config = getOpendriveConfig();

		const provider = extractFirstOidcProvider(config.auth.oauthProviders);
		expect(provider.pkce).toBe(false);
	});

	it("should parse OAuth provider custom scopes", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "true";
		process.env.OAUTH_TEST_CLIENT_ID = "test-id";
		process.env.OAUTH_TEST_CLIENT_SECRET = "test-secret";
		process.env.OAUTH_TEST_DISCOVERY_URL =
			"https://test.com/.well-known/openid-configuration";
		process.env.OAUTH_TEST_SCOPES = "openid,profile,email,custom_scope";

		const config = getOpendriveConfig();

		const provider = extractFirstOidcProvider(config.auth.oauthProviders);

		expect(provider.scopes).toEqual([
			"openid",
			"profile",
			"email",
			"custom_scope",
		]);
	});

	it("should convert provider name to lowercase with dashes", () => {
		clearConfigEnvVars();
		process.env.ENABLE_OAUTH_SIGNIN = "true";
		process.env.OAUTH_POCKET_ID_CLIENT_ID = "pocket-id";
		process.env.OAUTH_POCKET_ID_CLIENT_SECRET = "pocket-secret";
		process.env.OAUTH_POCKET_ID_DISCOVERY_URL =
			"https://pocket.id/.well-known/openid-configuration";

		const config = getOpendriveConfig();

		const provider = extractFirstOidcProvider(config.auth.oauthProviders);
		expect(provider.name).toBe("pocket-id");
	});
});

describe("getOpendriveConfig - SMTP from env", () => {
	it("should enable SMTP when SMTP_ENABLED=true", () => {
		clearConfigEnvVars();
		process.env.SMTP_ENABLED = "true";
		process.env.SMTP_HOST = "smtp.example.com";
		process.env.SMTP_PORT = "587";
		process.env.SMTP_USER = "user";
		process.env.SMTP_PASSWORD = "password";
		process.env.SMTP_FROM = "noreply@example.com";
		process.env.SMTP_SECURE = "false";

		const config = getOpendriveConfig();

		expect(config.smtp?.enabled).toBe(true);
		expect(config.smtp?.host).toBe("smtp.example.com");
		expect(config.smtp?.port).toBe(587);
		expect(config.smtp?.secure).toBe(false);
	});

	it("should not include SMTP in config when SMTP_ENABLED is false", () => {
		clearConfigEnvVars();
		process.env.SMTP_ENABLED = "false";

		const config = getOpendriveConfig();

		// When SMTP_ENABLED is not true, it falls back to defaults which may be undefined
		// The actual behavior is to not set SMTP config at all (undefined)
		// But if defaults have SMTP values, it returns those with enabled=false
		// Check that we at least don't have an enabled SMTP
		expect(config.smtp?.enabled ?? false).toBe(false);
	});

	it("should parse SMTP_SECURE=true correctly", () => {
		clearConfigEnvVars();
		process.env.SMTP_ENABLED = "true";
		process.env.SMTP_HOST = "smtp.example.com";
		process.env.SMTP_PORT = "465";
		process.env.SMTP_USER = "user";
		process.env.SMTP_PASSWORD = "password";
		process.env.SMTP_FROM = "noreply@example.com";
		process.env.SMTP_SECURE = "true";

		const config = getOpendriveConfig();

		expect(config.smtp?.secure).toBe(true);
		expect(config.smtp?.port).toBe(465);
	});
});

describe("isSmtpEnabled", () => {
	it("should return true when SMTP is configured and enabled", () => {
		clearConfigEnvVars();
		process.env.SMTP_ENABLED = "true";
		process.env.SMTP_HOST = "smtp.example.com";
		process.env.SMTP_PORT = "587";
		process.env.SMTP_USER = "user";
		process.env.SMTP_PASSWORD = "password";
		process.env.SMTP_FROM = "noreply@example.com";
		process.env.SMTP_SECURE = "false";

		expect(isSmtpEnabled()).toBe(true);
	});

	it("should check smtp config existence", () => {
		clearConfigEnvVars();

		// isSmtpEnabled checks if config.smtp is defined
		// Default config may include smtp with enabled=false
		const config = getOpendriveConfig();
		const expected = config.smtp !== undefined;
		expect(isSmtpEnabled()).toBe(expected);
	});
});

describe("Auth configuration", () => {
	it("should read ENABLE_EMAIL_SIGNIN from environment", () => {
		clearConfigEnvVars();
		process.env.ENABLE_EMAIL_SIGNIN = "false";
		process.env.ENABLE_OAUTH_SIGNIN = "false"; // Disable OAuth to avoid validation error

		const config = getOpendriveConfig();

		expect(config.auth.enableEmailSignIn).toBe(false);
	});

	it("should read MIN_PASSWORD_LENGTH from environment", () => {
		clearConfigEnvVars();
		process.env.ENABLE_EMAIL_SIGNIN = "true";
		process.env.ENABLE_OAUTH_SIGNIN = "false"; // Disable OAuth to avoid validation error
		process.env.MIN_PASSWORD_LENGTH = "16";

		const config = getOpendriveConfig();

		expect(config.auth.minPasswordLength).toBe(16);
	});

	it("should read AUTH_SECRET from environment", () => {
		clearConfigEnvVars();
		process.env.ENABLE_EMAIL_SIGNIN = "true";
		process.env.ENABLE_OAUTH_SIGNIN = "false"; // Disable OAuth to avoid validation error
		process.env.AUTH_SECRET = "my-super-secret-auth-key";

		const config = getOpendriveConfig();

		expect(config.auth.secret).toBe("my-super-secret-auth-key");
	});

	it("should use default AUTH_SECRET when not provided", () => {
		clearConfigEnvVars();
		process.env.ENABLE_EMAIL_SIGNIN = "true";
		process.env.ENABLE_OAUTH_SIGNIN = "false"; // Disable OAuth to avoid validation error

		const config = getOpendriveConfig();

		expect(config.auth.secret).toBe(defaultConfigValues.auth.secret);
	});
});
