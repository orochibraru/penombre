import packageJson from "../../../package.json" with { type: "json" };

/**
 * Default configuration values for Penombre.
 * Extracted to a separate file so it can be used by both:
 * - The runtime config loader (config.ts)
 * - The .example.env generator script (scripts/generate-env-example.ts)
 */

/** Everything the app writes lives under one directory. */
const DEFAULT_DATA_DIR = "/data";

/** Nothing is mounted at `/data` on a dev box — keep writes inside the repo. */
export const DEV_DATA_DIR = "./data";

/** The per-purpose subdirectories hanging off `dataDir`. */
export function dataPaths(dataDir: string): {
	storagePath: string;
	dbLocation: string;
} {
	return {
		storagePath: `${dataDir}/storage`,
		dbLocation: `${dataDir}/db`,
	};
}

/** SQLite is the default: no database server to run for a homelab install. */
export function defaultDbUrl(dataDir: string): string {
	return `file:${dataPaths(dataDir).dbLocation}/penombre.sqlite`;
}

export const defaultConfigValues = {
	appName: "Penombre",
	appVersion: packageJson.version,
	environment: "production" as "dev" | "production",
	origin: "http://localhost:3000",
	logLevel: "info" as "debug" | "info" | "warn" | "error",
	logFormat: "console" as "console" | "json",
	db: {
		url: defaultDbUrl(DEFAULT_DATA_DIR),
	},
	auth: {
		enableEmailSignIn: true,
		enableOAuthSignIn: false,
		enablePasskeySignIn: true,
		minPasswordLength: 8,
		secret: "change_this_secret_to_a_random_secure_value",
		oauthProviders: [],
	},
	redis: undefined as { url: string } | undefined,
	smtp: {
		enabled: false,
		host: "smtp.example.com",
		port: 587,
		user: "your-smtp-user",
		password: "your-smtp-password",
		from: "noreply@example.com",
		secure: false,
	},
	versionCheck: {
		enabled: true,
	},
	simpleMode: false,
	bypassAuth: false,
	autoRedirectProvider: "",
	dataDir: DEFAULT_DATA_DIR,
	...dataPaths(DEFAULT_DATA_DIR),
	worker: {
		mode: "embedded" as "embedded" | "external",
		concurrency: 4,
	},
};

/** First half: identity, database, auth and OAuth providers. */
function envCoreSection(): string {
	return `# ===========================================
# Penombre Configuration
# ===========================================

APP_NAME=${defaultConfigValues.appName}

# Environment: "dev" or "production"
APP_ENV=${defaultConfigValues.environment}

# Log level: "debug", "info", "warn", "error", or "trace"
LOG_LEVEL=${defaultConfigValues.logLevel}

# Log format: "console" or "json"
LOG_FORMAT=${defaultConfigValues.logFormat}

# Public origin URL (used for OAuth callbacks, etc.)
ORIGIN=${defaultConfigValues.origin}

# ===========================================
# Database
# ===========================================
# SQLite by default — a "file:"/"sqlite:" path, no database server needed.
# For PostgreSQL, use a connection string instead:
# DATABASE_URL=postgresql://penombre:penombre@localhost:5432/penombre
# DATABASE_URL=${defaultConfigValues.db.url}

# ===========================================
# Authentication
# ===========================================

# There are deliberately no ADMIN_EMAIL/ADMIN_PASSWORD variables. The first
# admin is created through the setup screen on first boot, so no instance ever
# ships with a password that is published in this file.

# ===========================================
# Auth Settings
# ===========================================

# Enable email/password sign-in
ENABLE_EMAIL_SIGNIN=${defaultConfigValues.auth.enableEmailSignIn}

# Force OAuth sign-in on or off. Leave it out and declaring a provider
# (below, or in Admin → Settings) is what turns it on.
ENABLE_OAUTH_SIGNIN=${defaultConfigValues.auth.enableOAuthSignIn}

# Force passkey sign-in on or off. Leave it out to manage it in
# Admin → Settings.
# ENABLE_PASSKEY_SIGNIN=${defaultConfigValues.auth.enablePasskeySignIn}

# Minimum password length for email sign-in
MIN_PASSWORD_LENGTH=${defaultConfigValues.auth.minPasswordLength}

# Secret key for signing auth tokens (CHANGE THIS IN PRODUCTION! - openssl rand -hex 32)
AUTH_SECRET=${defaultConfigValues.auth.secret}

# ===========================================
# OAuth Providers
# ===========================================
# Format: OAUTH_<PROVIDER_NAME>_<SETTING>
# Provider names should be UPPERCASE with underscores (e.g., POCKET_ID, GOOGLE, GITHUB)
#
# Example for a provider called "default":
OAUTH_DEFAULT_ENABLED=false
OAUTH_DEFAULT_CLIENT_ID=your-client-id
OAUTH_DEFAULT_CLIENT_SECRET=your-client-secret
OAUTH_DEFAULT_DISCOVERY_URL=https://auth.example.com/.well-known/openid-configuration
OAUTH_DEFAULT_PRETTY_NAME=Default OIDC Provider
OAUTH_DEFAULT_PKCE=true
OAUTH_DEFAULT_SCOPES=openid,profile,email
`;
}

/** Second half: everything else — runtime toggles, storage, SMTP. */
function envRuntimeSection(): string {
	return `
# ===========================================
# Redis (Optional - for distributed caching)
# ===========================================
# REDIS_URL=redis://localhost:6379

# Background worker: "embedded" runs it inside this container,
# "external" expects a separate penombre-worker container
WORKER_MODE=${defaultConfigValues.worker.mode}
WORKER_CONCURRENCY=${defaultConfigValues.worker.concurrency}

# ===========================================
# Simple mode
# ===========================================
# Turns the app into a bare shared file browser: one storage volume shared by
# every account, no per-user drives. Mount your files at STORAGE_PATH directly.
SIMPLE_MODE=${defaultConfigValues.simpleMode}

# Drop authentication entirely: no sign-in screen, every visitor is the shared
# owner. Only honoured when SIMPLE_MODE=true. Anyone who can reach the app gets
# full read/write access to the volume — keep it behind your own auth proxy or
# on a trusted network.
BYPASS_AUTH=${defaultConfigValues.bypassAuth}

# Skip the sign-in screen and send users straight to this OIDC provider (the
# <NAME> of an OAUTH_<NAME>_* block above, lowercased, e.g. "default").
# /auth/sign-in?form still shows the form, so you can't lock yourself out.
# AUTH_AUTO_REDIRECT_PROVIDER=default

# ===========================================
# Storage
# ===========================================
# Base directory for everything the app writes — uploads and the SQLite
# database. Defaults to "${DEV_DATA_DIR}" outside production.
# DATA_DIR=${defaultConfigValues.dataDir}

# Where uploaded files live on disk. Defaults to DATA_DIR/storage.
# STORAGE_PATH=${defaultConfigValues.storagePath}

# ===========================================
# Mounted volumes (Optional)
# ===========================================
# Extra directories mounted alongside the main drive. They show up in the
# sidebar and are scanned like the main storage root.
#
# Format: VOLUME_<NAME>_PATH, plus optional _LABEL and _READONLY.
# A volume is one tree shared by every account, in both modes — mount a library
# and everyone browses the files that are already on it.
#
# VOLUME_MEDIA_PATH=/mnt/media
# VOLUME_MEDIA_LABEL=Media library
# VOLUME_MEDIA_READONLY=false
# Seal what Penombre writes to this volume (needs ENCRYPTION_KEY). Files
# already there, or dropped in by other tools, are never rewritten.
# VOLUME_MEDIA_ENCRYPT=false

# ===========================================
# Encryption at rest (Optional)
# ===========================================
# Seals file bytes on personal and shared drives with AES-256-GCM. Lose the
# key and every sealed file is gone for good: back it up apart from DATA_DIR.
# Not supported with SIMPLE_MODE=true. Generate one: openssl rand -base64 32
# ENCRYPTION_KEY=
# Or read it from a file, e.g. a Docker secret outside DATA_DIR:
# ENCRYPTION_KEY_FILE=/run/secrets/penombre_encryption_key
# Retired keys, comma-separated, kept only to read files not yet rewrapped:
# ENCRYPTION_KEY_PREVIOUS=

# ===========================================
# SMTP (Optional - for email features)
# ===========================================
SMTP_ENABLED=${defaultConfigValues.smtp.enabled}
SMTP_HOST=${defaultConfigValues.smtp.host}
SMTP_PORT=${defaultConfigValues.smtp.port}
SMTP_USER=${defaultConfigValues.smtp.user}
SMTP_PASSWORD=${defaultConfigValues.smtp.password}
SMTP_FROM=${defaultConfigValues.smtp.from}
SMTP_SECURE=${defaultConfigValues.smtp.secure}

# ===========================================
# Version check (Optional)
# ===========================================
# Hourly check against GitHub releases for the "update available" banner.
# Off-instance by default in the sense that it calls api.github.com; set to
# false for an air-gapped or privacy-sensitive deployment.
ENABLE_VERSION_CHECK=${defaultConfigValues.versionCheck.enabled}

# Which release stream to compare against: "stable" or "canary". Defaults to
# "canary" when the running version itself is a "-canary.N" build, "stable"
# otherwise. Also settable in Admin → Settings.
# RELEASE_CHANNEL=stable

# ===========================================
# Data retention (Optional)
# ===========================================
# Days to keep activity log entries, notifications and finished background
# job rows before a nightly sweep deletes them. Unset keeps everything
# forever. Also settable in Admin → Settings.
# DATA_RETENTION_DAYS=90
`;
}

export function generateExampleDotenvFile(): string {
	return envCoreSection() + envRuntimeSection();
}
