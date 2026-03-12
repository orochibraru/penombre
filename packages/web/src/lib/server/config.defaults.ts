/**
 * Default configuration values for Opendrive.
 * Extracted to a separate file so it can be used by both:
 * - The runtime config loader (config.ts)
 * - The .example.env generator script (scripts/generate-env-example.ts)
 */

export const defaultConfigValues = {
	appName: "Opendrive",
	appVersion: "development",
	environment: "production" as "dev" | "production",
	origin: "http://localhost:3000",
	logLevel: "info" as "debug" | "info" | "warn" | "error",
	logFormat: "console" as "console" | "json",
	db: {
		url: "postgresql://opendrive:opendrive@localhost:5432/opendrive",
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
	smtp: {
		enabled: false,
		host: "smtp.example.com",
		port: 587,
		user: "your-smtp-user",
		password: "your-smtp-password",
		from: "noreply@example.com",
		secure: false,
	},
};

export function generateExampleDotenvFile(): string {
	return `# ===========================================
# Opendrive Configuration
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
