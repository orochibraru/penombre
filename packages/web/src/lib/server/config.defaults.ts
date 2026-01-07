/**
 * Default configuration values for Opendrive.
 * Extracted to a separate file so it can be used by both:
 * - The runtime config loader (config.ts)
 * - The .env.example generator script (scripts/generate-env-example.ts)
 */

export const defaultConfigValues = {
	environment: "production" as "dev" | "production",
	port: 8080,
	origin: "http://localhost:8080",
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
	},
	smtp: undefined,
};

export function generateExampleDotenvFile(): string {
	return `# ===========================================
# Opendrive Configuration
# ===========================================

# Environment: "dev" or "production"
APP_ENV=${defaultConfigValues.environment}

# Log level: "debug", "info", "warn", "error", or "trace"
LOG_LEVEL=${defaultConfigValues.logLevel}
# Log format: "console" or "json"
LOG_FORMAT=${defaultConfigValues.logFormat}

# Server port
PORT=${defaultConfigValues.port}

# Public origin URL (used for OAuth callbacks, etc.)
ORIGIN=${defaultConfigValues.origin}

# ===========================================
# Database
# ===========================================
DATABASE_URL=${defaultConfigValues.db.url}

# ===========================================
# Authentication
# ===========================================

# Enable email/password sign-in
ENABLE_EMAIL_SIGNIN=${defaultConfigValues.auth.enableEmailSignIn}

# Enable OAuth sign-in (requires at least one provider configured below)
ENABLE_OAUTH_SIGNIN=${defaultConfigValues.auth.enableOAuthSignIn}

# Minimum password length for email sign-in
MIN_PASSWORD_LENGTH=${defaultConfigValues.auth.minPasswordLength}

# Secret key for signing auth tokens (CHANGE THIS IN PRODUCTION!)
AUTH_SECRET=${defaultConfigValues.auth.secret}

# ===========================================
# OAuth Providers
# ===========================================
# Format: OAUTH_<PROVIDER_NAME>_<SETTING>
# Provider names should be UPPERCASE with underscores (e.g., POCKET_ID, GOOGLE, GITHUB)
#
# Example for a provider called "pocketid":
# OAUTH_POCKETID_CLIENT_ID=your-client-id
# OAUTH_POCKETID_CLIENT_SECRET=your-client-secret
# OAUTH_POCKETID_DISCOVERY_URL=https://auth.example.com/.well-known/openid-configuration
# OAUTH_POCKETID_ENABLED=true
# OAUTH_POCKETID_PRETTY_NAME=Pocket ID
# OAUTH_POCKETID_PKCE=true
# OAUTH_POCKETID_SCOPES=openid,profile,email

# ===========================================
# SMTP (Optional - for email features)
# ===========================================
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-smtp-user
# SMTP_PASSWORD=your-smtp-password
# SMTP_FROM=noreply@example.com
# SMTP_SECURE=false
`;
}
