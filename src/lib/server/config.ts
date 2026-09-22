import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import z from "zod";
import { building, dev } from "$app/env";
import {
	DEV_DATA_DIR,
	dataPaths,
	defaultConfigValues,
	defaultDbUrl,
	generateExampleDotenvFile,
} from "./config.defaults";

export { generateExampleDotenvFile };

// Not `$app/env/private`: that needs every name declared up front, and
// `OAUTH_<NAME>_*` / `VOLUME_<NAME>_*` are discovered by scanning keys.
const env = process.env;

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

/**
 * An extra directory mounted alongside the main drive.
 *
 * Declared with `VOLUME_<NAME>_PATH` (and an optional `_LABEL`), mirroring the
 * dynamic `OAUTH_<NAME>_*` convention already used for providers.
 */
const volumeSchema = z.object({
	/** Stable id used in storage keys and DB rows. Lowercased env name. */
	name: z.string().min(1),
	/** What the sidebar shows. */
	label: z.string().min(1),
	/** Absolute path on the host. */
	path: z.string().min(1),
	/** Refuse writes; the volume browses but cannot be modified. */
	readOnly: z.boolean().default(false),
	/** Seal what Penombre writes here. Existing files are never rewritten. */
	encrypt: z.boolean().optional(),
});

export type VolumeConfig = z.infer<typeof volumeSchema>;

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
				enablePasskeySignIn: z
					.boolean()
					.default(defaultConfigValues.auth.enablePasskeySignIn),
				minPasswordLength: z
					.number()
					.default(defaultConfigValues.auth.minPasswordLength),
				secret: z.string().default(defaultConfigValues.auth.secret),
				oauthProviders: z
					.array(oauthProviderSchema)
					.default(defaultConfigValues.auth.oauthProviders),
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
		versionCheck: z
			.object({
				enabled: z.boolean().default(defaultConfigValues.versionCheck.enabled),
				releaseChannel: z.enum(["stable", "canary"]).optional(),
			})
			.optional()
			.default(defaultConfigValues.versionCheck),
		/** Days to keep activity/notification/job history. Unset keeps it forever. */
		dataRetentionDays: z.number().int().positive().optional(),
		simpleMode: z.boolean().default(defaultConfigValues.simpleMode),
		bypassAuth: z.boolean().default(defaultConfigValues.bypassAuth),
		autoRedirectProvider: z
			.string()
			.default(defaultConfigValues.autoRedirectProvider),
		dataDir: z.string().default(defaultConfigValues.dataDir),
		storagePath: z.string().default(defaultConfigValues.storagePath),
		dbLocation: z.string().default(defaultConfigValues.dbLocation),
		volumes: z.array(volumeSchema).default([]),
		encryption: z
			.object({
				key: z
					.instanceof(Buffer)
					.refine((key) => key.length === 32, {
						message: "ENCRYPTION_KEY must be 32 bytes, base64",
					})
					.optional(),
				previous: z.array(
					z.instanceof(Buffer).refine((key) => key.length === 32, {
						message: "ENCRYPTION_KEY_PREVIOUS keys must be 32 bytes, base64",
					}),
				),
			})
			.default({ previous: [] }),
		worker: z
			.object({
				mode: z
					.enum(["embedded", "external"])
					.default(defaultConfigValues.worker.mode),
				concurrency: z.coerce
					.number()
					.int()
					.positive()
					.default(defaultConfigValues.worker.concurrency),
			})
			.optional()
			.default(defaultConfigValues.worker),
	})
	.superRefine((config, ctx) => {
		// Simple mode's root is a library other tools read; sealing it would
		// turn someone's music folder into ciphertext.
		if (config.simpleMode && config.encryption.key) {
			ctx.addIssue({
				code: "custom",
				message: "ENCRYPTION_KEY is not supported with SIMPLE_MODE=true",
			});
		}
		for (const volume of config.volumes.filter((v) => v.encrypt)) {
			if (volume.readOnly || !config.encryption.key) {
				ctx.addIssue({
					code: "custom",
					message: `Volume "${volume.name}": _ENCRYPT needs ENCRYPTION_KEY and a writable volume`,
				});
			}
		}
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
	});

export type AppConfig = z.infer<typeof configSchema>;

export type OAuthProviderSchema = z.infer<typeof oauthProviderSchema>;

export type OAuthProviderInput = z.input<typeof oauthProviderSchema>;

export function validateConfig(config: unknown): AppConfig {
	return configSchema.parse(config);
}

/**
 * Extra volumes from `VOLUME_<NAME>_PATH` / `VOLUME_<NAME>_LABEL` /
 * `VOLUME_<NAME>_READONLY`. A volume without a path is skipped.
 */
function parseVolumes(): VolumeConfig[] {
	const names = new Set<string>();
	for (const key of Object.keys(env)) {
		const match = key.match(
			/^VOLUME_([A-Z0-9_]+)_(PATH|LABEL|READONLY|ENCRYPT)$/,
		);
		if (match?.[1]) {
			names.add(match[1]);
		}
	}

	const volumes: VolumeConfig[] = [];
	for (const rawName of names) {
		const path = env[`VOLUME_${rawName}_PATH`];
		if (!path) {
			continue;
		}
		const name = rawName.toLowerCase().replace(/_/g, "-");
		volumes.push({
			name,
			label: env[`VOLUME_${rawName}_LABEL`] || name,
			path: resolve(path),
			readOnly: env[`VOLUME_${rawName}_READONLY`] === "true",
			encrypt: env[`VOLUME_${rawName}_ENCRYPT`] === "true",
		});
	}
	return volumes;
}

const keyFiles = new Map<string, string>();

/** Read once per path: `getConfig()` runs on every request. */
function readKeyFile(path: string): string {
	let raw = keyFiles.get(path);
	if (raw === undefined) {
		raw = readFileSync(path, "utf8").trim();
		keyFiles.set(path, raw);
	}
	return raw;
}

/** `ENCRYPTION_KEY` or `_FILE`, plus `_PREVIOUS`. Mirrors `envelope.LoadKeyring` in Go. */
function resolveEncryption(): { key?: Buffer; previous: Buffer[] } {
	const file = env.ENCRYPTION_KEY_FILE?.trim();
	const inline = env.ENCRYPTION_KEY?.trim();
	if (file && inline) {
		throw new Error("Set ENCRYPTION_KEY or ENCRYPTION_KEY_FILE, not both");
	}
	const raw = file ? readKeyFile(file) : inline;
	return {
		key: raw ? Buffer.from(raw, "base64") : undefined,
		previous: (env.ENCRYPTION_KEY_PREVIOUS ?? "")
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => Buffer.from(part, "base64")),
	};
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
	// Declaring a provider is itself configuration: reading only the three
	// toggles meant a deployment with nothing but `OAUTH_<NAME>_*` fell back to
	// the defaults and dropped every provider it had declared.
	const oauthProviders = parseOAuthProviders();
	const configured =
		env.ENABLE_EMAIL_SIGNIN ||
		env.ENABLE_OAUTH_SIGNIN ||
		env.ENABLE_PASSKEY_SIGNIN ||
		env.MIN_PASSWORD_LENGTH ||
		oauthProviders.length > 0;
	if (!configured) {
		return defaultConfigValues.auth;
	}

	return {
		enableEmailSignIn: env.ENABLE_EMAIL_SIGNIN !== "false",
		// Absent, the providers decide: none declared means nothing to offer.
		enableOAuthSignIn: env.ENABLE_OAUTH_SIGNIN
			? env.ENABLE_OAUTH_SIGNIN !== "false"
			: oauthProviders.length > 0,
		enablePasskeySignIn: env.ENABLE_PASSKEY_SIGNIN !== "false",
		minPasswordLength: env.MIN_PASSWORD_LENGTH
			? Number.parseInt(env.MIN_PASSWORD_LENGTH, 10)
			: defaultConfigValues.auth.minPasswordLength,
		secret: env.AUTH_SECRET || defaultConfigValues.auth.secret,
		oauthProviders:
			oauthProviders.length > 0
				? oauthProviders
				: defaultConfigValues.auth.oauthProviders,
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
	// Nothing is mounted at `/data` on a dev box or at build time, so writes stay in the repo.
	const dataDir =
		env.DATA_DIR ||
		(dev || building ? DEV_DATA_DIR : defaultConfigValues.dataDir);
	const paths = dataPaths(dataDir);

	return validateConfig({
		appName: env.APP_NAME || defaultConfigValues.appName,
		// package.json's, inlined at build time. The release override is set only
		// by publish.yaml when it promotes an already-tested PR image.
		appVersion: env.PENOMBRE_RELEASE_VERSION || defaultConfigValues.appVersion,
		environment: env.APP_ENV || defaultConfigValues.environment,
		origin: env.ORIGIN || defaultConfigValues.origin,
		logLevel: resolveLogLevel(),
		logFormat: resolveLogFormat(),
		// Trimmed and `||`: an empty or whitespace `DATABASE_URL` (an unset var
		// rendered by a deploy UI or compose) means "not set".
		db: { url: env.DATABASE_URL?.trim() || defaultDbUrl(dataDir) },
		auth: resolveAuthConfig(),
		redis: redisUrl ? { url: redisUrl } : defaultConfigValues.redis,
		smtp: resolveSmtpConfig(),
		versionCheck: {
			enabled: env.ENABLE_VERSION_CHECK !== "false",
			releaseChannel:
				env.RELEASE_CHANNEL === "stable" || env.RELEASE_CHANNEL === "canary"
					? env.RELEASE_CHANNEL
					: undefined,
		},
		dataRetentionDays: env.DATA_RETENTION_DAYS
			? Number.parseInt(env.DATA_RETENTION_DAYS, 10)
			: undefined,
		simpleMode: env.SIMPLE_MODE === "true",
		bypassAuth: env.BYPASS_AUTH === "true",
		autoRedirectProvider: env.AUTH_AUTO_REDIRECT_PROVIDER || "",
		// `resolve` anchors a relative path to the cwd and leaves an absolute one
		// alone — joining the cwd on top of it turned the documented
		// `STORAGE_PATH=/data/storage` into `/app/data/storage` in the container,
		// so a mounted volume was never actually read or written.
		dataDir: resolve(dataDir),
		storagePath: resolve(env.STORAGE_PATH || paths.storagePath),
		dbLocation: resolve(paths.dbLocation),
		volumes: parseVolumes(),
		encryption: resolveEncryption(),
		// Raw, so the schema names a typo (`External`, `-1`) instead of
		// silently falling back to the default.
		worker: {
			mode: env.WORKER_MODE?.trim() || undefined,
			concurrency: env.WORKER_CONCURRENCY?.trim() || undefined,
		},
	});
}

/**
 * Which settings the environment explicitly provides.
 *
 * The rule is: **env wins when it is set, otherwise the database governs.**
 * Without this the defaults were indistinguishable from a deliberate env
 * value, so removing a var from `.env` left a setting nothing could change —
 * env said "true" by default and the UI refused to touch it.
 */
export function envProvided(): {
	emailSignIn: boolean;
	oauthSignIn: boolean;
	passkeySignIn: boolean;
	minPasswordLength: boolean;
	smtp: boolean;
	versionCheck: boolean;
	releaseChannel: boolean;
	dataRetention: boolean;
} {
	return {
		emailSignIn: env.ENABLE_EMAIL_SIGNIN !== undefined,
		oauthSignIn: env.ENABLE_OAUTH_SIGNIN !== undefined,
		passkeySignIn: env.ENABLE_PASSKEY_SIGNIN !== undefined,
		minPasswordLength: env.MIN_PASSWORD_LENGTH !== undefined,
		smtp: env.SMTP_ENABLED !== undefined,
		versionCheck: env.ENABLE_VERSION_CHECK !== undefined,
		releaseChannel: env.RELEASE_CHANNEL !== undefined,
		dataRetention: env.DATA_RETENTION_DAYS !== undefined,
	};
}

export function isSmtpEnabled(): boolean {
	const config = getConfig();
	return config.smtp !== undefined;
}

/** Absolute path to the storage root — where uploaded bytes live on disk. */
export function getStoragePath(): string {
	return getConfig().storagePath;
}

/** Every extra volume mounted alongside the main drive. */
export function getVolumes(): VolumeConfig[] {
	return getConfig().volumes;
}

/** One mounted volume by name, or undefined. */
export function getVolume(name: string): VolumeConfig | undefined {
	return getVolumes().find((volume) => volume.name === name);
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
