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
	simpleMode: false,
	bypassAuth: false,
	autoRedirectProvider: "",
	dataDir: DEFAULT_DATA_DIR,
	...dataPaths(DEFAULT_DATA_DIR),
};

export function generateExampleDotenvFile(): string {
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

# Enable OAuth sign-in (requires at least one provider configured below)
ENABLE_OAUTH_SIGNIN=${defaultConfigValues.auth.enableOAuthSignIn}

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

# ===========================================
# Redis (Optional - for distributed caching)
# ===========================================
# REDIS_URL=redis://localhost:6379

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
# In simple mode a volume is shared whole by every account; in full mode each
# user gets their own subdirectory of it, exactly like the main drive.
#
# VOLUME_MEDIA_PATH=/mnt/media
# VOLUME_MEDIA_LABEL=Media library
# VOLUME_MEDIA_READONLY=false

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
`;
}
