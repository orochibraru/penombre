/**
 * Default configuration values for Penombre.
 * Extracted to a separate file so it can be used by both:
 * - The runtime config loader (config.ts)
 * - The .example.env generator script (scripts/generate-env-example.ts)
 */

export const defaultConfigValues = {
	appName: "Penombre",
	appVersion: "development",
	environment: "production" as "dev" | "production",
	origin: "http://localhost:3000",
	logLevel: "info" as "debug" | "info" | "warn" | "error",
	logFormat: "console" as "console" | "json",
	db: {
		url: "postgresql://penombre:penombre@localhost:5432/penombre",
	},
	auth: {
		enableEmailSignIn: true,
		enableOAuthSignIn: false,
		minPasswordLength: 8,
		secret: "change_this_secret_to_a_random_secure_value",
		oauthProviders: [],
		defaultAdminCredentials: {
			email: "admin@example.com",
			password: "Admin1234!",
		},
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
	storage: {
		backend: "local" as "local" | "s3",
	},
};

export function generateExampleDotenvFile(): string {
	return `# ===========================================
# Penombre Configuration
# ===========================================

APP_NAME=${defaultConfigValues.appName}
APP_VERSION=${defaultConfigValues.appVersion}

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
DATABASE_URL=${defaultConfigValues.db.url}

# ===========================================
# Authentication
# ===========================================

# Default admin user credentials (used only during initial seeding)
ADMIN_EMAIL=${defaultConfigValues.auth.defaultAdminCredentials.email}
ADMIN_PASSWORD=${defaultConfigValues.auth.defaultAdminCredentials.password}

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
# Storage Backend
# ===========================================
# Backend to use for file storage: "local" (default) or "s3"
STORAGE_BACKEND=local

# Local storage path (used for both backends: files on local, thumbnails on s3)
# STORAGE_PATH=/data/storage

# ===========================================
# S3-compatible Storage (required when STORAGE_BACKEND=s3)
# ===========================================
# Works with AWS S3, MinIO, Cloudflare R2, Backblaze B2, and any S3-compatible API.
# S3_BUCKET=my-bucket
# S3_ACCESS_KEY_ID=your-access-key-id
# S3_SECRET_ACCESS_KEY=your-secret-access-key
# S3_REGION=us-east-1
# Custom endpoint for S3-compatible providers (omit for AWS S3):
# S3_ENDPOINT=https://s3.example.com
# Use path-style URLs (required for MinIO and some providers):
# S3_PATH_STYLE=false

# ===========================================
# Garage (self-hosted S3 — required when using the bundled Garage service)
# ===========================================
# RPC secret shared between all Garage nodes. Must be a 32-byte hex string.
# Generate with: openssl rand -hex 32
# GARAGE_RPC_SECRET=

# The S3_* variables below are also passed to the Garage container to provision
# the bucket and key pair on first start. Override them in .env for production.
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
