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

const penombreConfigSchema = z
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
	})
	.superRefine((config, ctx) => {
		if (config.smtp?.enabled) {
			if (!config.smtp.host) {
				ctx.addIssue({
					code: "custom",
					message: "SMTP 'host' field must be defined when SMTP is configured",
				});
			}
			if (!config.smtp.port) {
				ctx.addIssue({
					code: "custom",
					message: "SMTP 'port' field must be defined when SMTP is configured",
				});
			}
			if (!config.smtp.user) {
				ctx.addIssue({
					code: "custom",
					message: "SMTP 'user' field must be defined when SMTP is configured",
				});
			}
			if (!config.smtp.password) {
				ctx.addIssue({
					code: "custom",
					message:
						"SMTP 'password' field must be defined when SMTP is configured",
				});
			}
			if (!config.smtp.from) {
				ctx.addIssue({
					code: "custom",
					message: "SMTP 'from' field must be defined when SMTP is configured",
				});
			}
			if (config.smtp.secure === undefined) {
				ctx.addIssue({
					code: "custom",
					message:
						"SMTP 'secure' field must be defined when SMTP is configured",
				});
			}
		}

		if (config.auth) {
			if (config.auth.enableOAuthSignIn) {
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
		}
	});

export type PenombreConfig = z.infer<typeof penombreConfigSchema>;

export type OAuthProviderSchema = z.infer<typeof oauthProviderSchema>;

export type OAuthProviderInput = z.input<typeof oauthProviderSchema>;

export function validatePenombreConfig(config: unknown): PenombreConfig {
	return penombreConfigSchema.parse(config);
}

export function getPenombreConfig(): PenombreConfig {
	// Oauth config env variable format: OAUTH_<PROVIDER_NAME>_CLIENT_ID, OAUTH_<PROVIDER_NAME>_CLIENT_SECRET, OAUTH_<PROVIDER_NAME>_DISCOVERY_URL
	const oauthProviders: OAuthProviderInput[] = [];

	// Extract unique provider names from env vars
	const providerNames = new Set<string>();
	for (const key of Object.keys(env)) {
		const match = key.match(
			/^OAUTH_([A-Z0-9_]+)_(CLIENT_ID|CLIENT_SECRET|DISCOVERY_URL|ENABLED|PRETTY_NAME|PKCE|SCOPES)$/,
		);
		if (match?.[1]) {
			providerNames.add(match[1]);
		}
	}

	// Build provider configs from env vars
	for (const providerName of providerNames) {
		const clientId = env[`OAUTH_${providerName}_CLIENT_ID`];
		const clientSecret = env[`OAUTH_${providerName}_CLIENT_SECRET`];
		const discoveryUrl = env[`OAUTH_${providerName}_DISCOVERY_URL`];
		const enabled = env[`OAUTH_${providerName}_ENABLED`] !== "false";
		const scopesEnv = env[`OAUTH_${providerName}_SCOPES`];
		const prettyName = env[`OAUTH_${providerName}_PRETTY_NAME`];
		const pkceEnv = env[`OAUTH_${providerName}_PKCE`];
		const pkce = pkceEnv === undefined ? true : pkceEnv === "true";
		const scopes = scopesEnv
			? scopesEnv.split(",").map((s) => s.trim())
			: undefined;

		// Skip incomplete provider configs
		if (!clientId || !clientSecret || !discoveryUrl) {
			console.warn(
				`Skipping OAuth provider "${providerName}": missing required env vars (CLIENT_ID, CLIENT_SECRET, or DISCOVERY_URL)`,
			);
			continue;
		}

		oauthProviders.push({
			name: providerName.toLowerCase().replace(/_/g, "-"),
			clientId,
			clientSecret,
			discoveryUrl,
			prettyName,
			pkce,
			enabled,
			...(scopes && { scopes }),
		});
	}

	const smtpEnabled = env.SMTP_ENABLED === "true";

	const anyDbVariableConfigured = env.DATABASE_URL;

	const anyAuthVariableConfigured =
		env.ENABLE_EMAIL_SIGNIN ||
		env.ENABLE_OAUTH_SIGNIN ||
		env.MIN_PASSWORD_LENGTH;

	const environmentVariables = {
		appName: env.APP_NAME || defaultConfigValues.appName,
		appVersion: env.APP_VERSION || defaultConfigValues.appVersion,
		environment: env.APP_ENV || defaultConfigValues.environment,
		origin: env.ORIGIN || defaultConfigValues.origin,
		logLevel:
			env.LOG_LEVEL === "debug" ||
			env.LOG_LEVEL === "info" ||
			env.LOG_LEVEL === "warn" ||
			env.LOG_LEVEL === "error"
				? env.LOG_LEVEL
				: defaultConfigValues.logLevel,
		logFormat:
			env.LOG_FORMAT === "console" || env.LOG_FORMAT === "json"
				? env.LOG_FORMAT
				: defaultConfigValues.logFormat,
		db: anyDbVariableConfigured
			? {
					url: env.DATABASE_URL,
				}
			: defaultConfigValues.db,
		auth: anyAuthVariableConfigured
			? {
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
				}
			: defaultConfigValues.auth,
		smtp: smtpEnabled
			? {
					enabled: env.SMTP_ENABLED === "true",
					host: env.SMTP_HOST,
					port: env.SMTP_PORT ? Number.parseInt(env.SMTP_PORT, 10) : undefined,
					user: env.SMTP_USER,
					password: env.SMTP_PASSWORD,
					from: env.SMTP_FROM,
					secure: env.SMTP_SECURE === "true",
				}
			: defaultConfigValues.smtp,
	};

	return validatePenombreConfig(environmentVariables);
}

export function isSmtpEnabled(): boolean {
	const config = getPenombreConfig();
	return config.smtp !== undefined;
}
