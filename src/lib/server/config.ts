import z from "zod";
import { env } from "$env/dynamic/private";
import {
	defaultConfigValues,
	generateExampleDotenvFile,
} from "./config.defaults";

export { generateExampleDotenvFile };

const oauthProviderSchema = z.object({
	name: z.string(),
	clientId: z.string(),
	clientSecret: z.string(),
	discoveryUrl: z.url(),
	pkce: z.boolean().optional().default(true),
	prettyName: z.string().optional(),
	scopes: z
		.array(z.string())
		.optional()
		.default(["openid", "profile", "email"]),
	enabled: z.boolean().default(true),
});

const REQUIRED_SMTP_FIELDS = [
	"host",
	"port",
	"user",
	"password",
	"from",
] as const;

const configSchema = z
	.object({
		appName: z.string().default(defaultConfigValues.appName),
		appVersion: z.string().default(defaultConfigValues.appVersion),
		environment: z
			.enum(["dev", "production"])
			.default(defaultConfigValues.environment),
		origin: z.string().default(defaultConfigValues.origin),
		logLevel: z
			.enum(["debug", "info", "warn", "error"])
			.default(defaultConfigValues.logLevel),
		logFormat: z
			.enum(["console", "json"])
			.default(defaultConfigValues.logFormat),
		db: z
			.object({
				url: z.url().default(defaultConfigValues.db.url),
			})
			.optional()
			.default(defaultConfigValues.db),
		auth: z
			.object({
				enableEmailSignIn: z
					.boolean()
					.default(defaultConfigValues.auth.enableEmailSignIn),
				enableOAuthSignIn: z
					.boolean()
					.default(defaultConfigValues.auth.enableOAuthSignIn),
				minPasswordLength: z
					.number()
					.default(defaultConfigValues.auth.minPasswordLength),
				secret: z.string().default(defaultConfigValues.auth.secret),
				oauthProviders: z
					.array(oauthProviderSchema)
					.default(defaultConfigValues.auth.oauthProviders),
				defaultAdminCredentials: z
					.object({
						email: z.email(),
						password: z.string().min(8),
					})
					.default(defaultConfigValues.auth.defaultAdminCredentials),
			})
			.optional()
			.default(defaultConfigValues.auth),
		redis: z
			.object({
				url: z.string().min(1),
			})
			.optional(),
		smtp: z
			.object({
				enabled: z.boolean().default(false),
				host: z.string().min(1),
				port: z.number().min(1),
				user: z.string().min(1),
				password: z.string().min(1),
				from: z.string().min(1),
				secure: z.boolean(),
			})
			.optional(),
		simpleMode: z.boolean().default(defaultConfigValues.simpleMode),
		bypassAuth: z.boolean().default(defaultConfigValues.bypassAuth),
		autoRedirectProvider: z
			.string()
			.default(defaultConfigValues.autoRedirectProvider),
	})
	.superRefine((config, ctx) => {
		if (config.smtp?.enabled) {
			for (const field of REQUIRED_SMTP_FIELDS) {
				if (!config.smtp[field]) {
					ctx.addIssue({
						code: "custom",
						message: `SMTP '${field}' field must be defined when SMTP is configured`,
					});
				}
			}
			// `secure` is a boolean, so `false` is a valid value — only absence is an error
			if (config.smtp.secure === undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"SMTP 'secure' field must be defined when SMTP is configured",
				});
			}
		}

		if (config.auth?.enableOAuthSignIn) {
			const enabledProviders = config.auth.oauthProviders.filter(
				(p) => p.enabled,
			);
			if (enabledProviders.length === 0) {
				ctx.addIssue({
					code: "custom",
					message:
						"At least one OAuth provider must be enabled when OAuth sign-in is enabled",
				});
			}
		}
	});

export type AppConfig = z.infer<typeof configSchema>;

export type OAuthProviderSchema = z.infer<typeof oauthProviderSchema>;

export type OAuthProviderInput = z.input<typeof oauthProviderSchema>;

export function validateConfig(config: unknown): AppConfig {
	return configSchema.parse(config);
}

/** Provider names appearing in any OAUTH_<NAME>_<FIELD> env var */
function collectOAuthProviderNames(): Set<string> {
	const providerNames = new Set<string>();
	for (const key of Object.keys(env)) {
		const match = key.match(
			/^OAUTH_([A-Z0-9_]+)_(CLIENT_ID|CLIENT_SECRET|DISCOVERY_URL|ENABLED|PRETTY_NAME|PKCE|SCOPES)$/,
		);
		if (match?.[1]) {
			providerNames.add(match[1]);
		}
	}
	return providerNames;
}

/**
 * Build OAuth provider configs from env vars.
 * Format: OAUTH_<PROVIDER_NAME>_CLIENT_ID, OAUTH_<PROVIDER_NAME>_CLIENT_SECRET, ...
 * Providers missing a client id, secret or discovery URL are skipped.
 */
function parseOAuthProviders(): OAuthProviderInput[] {
	const oauthProviders: OAuthProviderInput[] = [];

	for (const providerName of collectOAuthProviderNames()) {
		const clientId = env[`OAUTH_${providerName}_CLIENT_ID`];
		const clientSecret = env[`OAUTH_${providerName}_CLIENT_SECRET`];
		const discoveryUrl = env[`OAUTH_${providerName}_DISCOVERY_URL`];

		// Skip incomplete provider configs
		if (!(clientId && clientSecret && discoveryUrl)) {
			continue;
		}

		const scopesEnv = env[`OAUTH_${providerName}_SCOPES`];
		const scopes = scopesEnv
			? scopesEnv.split(",").map((s) => s.trim())
			: undefined;
		const pkceEnv = env[`OAUTH_${providerName}_PKCE`];

		oauthProviders.push({
			name: providerName.toLowerCase().replace(/_/g, "-"),
			clientId,
			clientSecret,
			discoveryUrl,
			prettyName: env[`OAUTH_${providerName}_PRETTY_NAME`],
			pkce: pkceEnv === undefined ? true : pkceEnv === "true",
			enabled: env[`OAUTH_${providerName}_ENABLED`] !== "false",
			...(scopes && { scopes }),
		});
	}

	return oauthProviders;
}

function resolveAuthConfig() {
	const configured =
		env.ENABLE_EMAIL_SIGNIN ||
		env.ENABLE_OAUTH_SIGNIN ||
		env.MIN_PASSWORD_LENGTH;
	if (!configured) {
		return defaultConfigValues.auth;
	}

	const oauthProviders = parseOAuthProviders();
	return {
		enableEmailSignIn: env.ENABLE_EMAIL_SIGNIN !== "false",
		enableOAuthSignIn: env.ENABLE_OAUTH_SIGNIN !== "false",
		minPasswordLength: env.MIN_PASSWORD_LENGTH
			? Number.parseInt(env.MIN_PASSWORD_LENGTH, 10)
			: defaultConfigValues.auth.minPasswordLength,
		secret: env.AUTH_SECRET || defaultConfigValues.auth.secret,
		oauthProviders:
			oauthProviders.length > 0
				? oauthProviders
				: defaultConfigValues.auth.oauthProviders,
		defaultAdminCredentials: {
			email:
				env.ADMIN_EMAIL ||
				defaultConfigValues.auth.defaultAdminCredentials.email,
			password:
				env.ADMIN_PASSWORD ||
				defaultConfigValues.auth.defaultAdminCredentials.password,
		},
	};
}

function resolveSmtpConfig() {
	if (env.SMTP_ENABLED !== "true") {
		return defaultConfigValues.smtp;
	}

	return {
		enabled: true,
		host: env.SMTP_HOST,
		port: env.SMTP_PORT ? Number.parseInt(env.SMTP_PORT, 10) : undefined,
		user: env.SMTP_USER,
		password: env.SMTP_PASSWORD,
		from: env.SMTP_FROM,
		secure: env.SMTP_SECURE === "true",
	};
}

function resolveLogLevel() {
	const level = env.LOG_LEVEL;
	return level === "debug" ||
		level === "info" ||
		level === "warn" ||
		level === "error"
		? level
		: defaultConfigValues.logLevel;
}

function resolveLogFormat() {
	const format = env.LOG_FORMAT;
	return format === "console" || format === "json"
		? format
		: defaultConfigValues.logFormat;
}

export function getConfig(): AppConfig {
	const redisUrl = env.REDIS_URL;

	return validateConfig({
		appName: env.APP_NAME || defaultConfigValues.appName,
		appVersion: env.APP_VERSION || defaultConfigValues.appVersion,
		environment: env.APP_ENV || defaultConfigValues.environment,
		origin: env.ORIGIN || defaultConfigValues.origin,
		logLevel: resolveLogLevel(),
		logFormat: resolveLogFormat(),
		db: env.DATABASE_URL ? { url: env.DATABASE_URL } : defaultConfigValues.db,
		auth: resolveAuthConfig(),
		redis: redisUrl ? { url: redisUrl } : defaultConfigValues.redis,
		smtp: resolveSmtpConfig(),
		simpleMode: env.SIMPLE_MODE === "true",
		bypassAuth: env.BYPASS_AUTH === "true",
		autoRedirectProvider: env.AUTH_AUTO_REDIRECT_PROVIDER || "",
	});
}

export function isSmtpEnabled(): boolean {
	const config = getConfig();
	return config.smtp !== undefined;
}

/** Simple mode: one shared storage volume/drive for every account, no per-user drives. */
export function isSimpleMode(): boolean {
	const config = getConfig();
	return config.simpleMode;
}

/**
 * Auth bypass: no sign-in at all, every request runs as the shared owner.
 * Simple-mode only — without one shared drive there'd be no account to be.
 */
export function isAuthBypassed(): boolean {
	const config = getConfig();
	return config.simpleMode && config.bypassAuth;
}
