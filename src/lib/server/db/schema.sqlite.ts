/**
 * SQLite mirror of `schema.pg.ts` — same table/column names, dialect-native
 * builders. Kept in sync by hand; see the substitution table in the SQLite
 * support plan for the recurring Postgres → SQLite column mappings.
 *
 * No `relations(...)` here: the app never uses Drizzle's relational query
 * API (`db.query.*`), only the plain query builder, so they'd be dead
 * metadata — `schema.pg.ts`'s copies aren't consumed either.
 */

import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import type { AppSettingsData, UserPreferencesData } from "./schema.pg";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull(),
	role: text("role"),
	banned: integer("banned", { mode: "boolean" }).default(false),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
	twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(
		false,
	),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const activity = sqliteTable(
	"activity",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		action: text("action", {
			enum: ["create", "update", "delete", "share", "rename"],
		}).notNull(),
		message: text("message").notNull(),
		link: text("link"),
		level: text("level", { enum: ["info", "warning", "error"] }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("activity_userId_idx").on(table.userId),
		index("activity_createdAt_idx").on(table.createdAt),
	],
);

export const sharings = sqliteTable(
	"sharings",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text("owner_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		resourceType: text("resource_type", {
			enum: ["file", "folder"],
		}).notNull(),
		resourceId: text("resource_id").notNull(),
		permission: text("permission", {
			enum: ["read", "write", "admin"],
		}).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
		expiration: integer("expiration", { mode: "timestamp_ms" }),
	},
	(table) => [
		index("sharings_ownerId_idx").on(table.ownerId),
		index("sharings_resourceId_idx").on(table.resourceId),
	],
);

export const sharedWith = sqliteTable(
	"shared_with",
	{
		id: text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		sharingId: text("sharing_id")
			.references(() => sharings.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("sharedWith_sharingId_idx").on(table.sharingId),
		index("sharedWith_userId_idx").on(table.userId),
	],
);

// =========================================================================
// SHARE LINKS
// =========================================================================

/**
 * A shareable link to one file or folder. Distinct from `sharings`, which
 * grants named users access — a share link is anonymous, addressed only by
 * its unguessable `token`.
 */
export const shares = sqliteTable(
	"shares",
	{
		id: text("id").primaryKey(),
		/** Unguessable public identifier — the whole URL secret. */
		token: text("token").notNull().unique(),
		ownerId: text("owner_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		resourceType: text("resource_type", {
			enum: ["file", "folder"],
		}).notNull(),
		resourceId: text("resource_id").notNull(),
		/** Display name captured at share time, so revoked/renamed items still list. */
		resourceName: text("resource_name").notNull(),
		/** Scrypt hash from better-auth's hasher; null means no password. */
		passwordHash: text("password_hash"),
		/** When true, only signed-in users may open the link. */
		requiresAuth: integer("requires_auth", { mode: "boolean" })
			.default(false)
			.notNull(),
		/** Null means the link never expires. */
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
		downloadCount: integer("download_count").default(0).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("shares_ownerId_idx").on(table.ownerId),
		index("shares_token_idx").on(table.token),
	],
);

// =========================================================================
// INSTANCE SETTINGS
// =========================================================================

export const appSettings = sqliteTable("app_settings", {
	id: text("id").primaryKey(),
	settings: text("settings", { mode: "json" })
		.$type<AppSettingsData>()
		.default({}),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull(),
});

// =========================================================================
// USER PREFERENCES
// =========================================================================

export const userPreferences = sqliteTable("user_preferences", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	preferences: text("preferences", { mode: "json" })
		.$type<UserPreferencesData>()
		.default({}),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull(),
});

export const apikey = sqliteTable("apikey", {
	id: text("id").primaryKey(),
	configId: text("config_id").notNull(),
	name: text("name"),
	start: text("start"),
	prefix: text("prefix"),
	key: text("key").notNull(),
	referenceId: text("reference_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	refillInterval: integer("refill_interval"),
	refillAmount: integer("refill_amount"),
	lastRefillAt: integer("last_refill_at", { mode: "timestamp_ms" }),
	enabled: integer("enabled", { mode: "boolean" }).notNull(),
	rateLimitEnabled: integer("rate_limit_enabled", {
		mode: "boolean",
	}).notNull(),
	rateLimitTimeWindow: integer("rate_limit_time_window"),
	rateLimitMax: integer("rate_limit_max"),
	requestCount: integer("request_count").notNull(),
	remaining: integer("remaining"),
	lastRequest: integer("last_request", { mode: "timestamp_ms" }),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	permissions: text("permissions"),
	metadata: text("metadata", { mode: "json" }).default({}),
});

export const passkey = sqliteTable("passkey", {
	id: text("id").primaryKey(),
	name: text("name"),
	publicKey: text("public_key").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	credentialID: text("credential_id").notNull(),
	counter: integer("counter").notNull(),
	deviceType: text("device_type").notNull(),
	backedUp: integer("backed_up", { mode: "boolean" }).notNull(),
	transports: text("transports"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }),
	aaguid: text("aaguid"),
});

export const twoFactor = sqliteTable(
	"two_factor",
	{
		id: text("id").primaryKey(),
		secret: text("secret").notNull(),
		backupCodes: text("backup_codes").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		verified: integer("verified", { mode: "boolean" }).default(true),
		failedVerificationCount: integer("failed_verification_count").default(0),
		lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
	},
	(table) => [
		index("two_factor_userId_idx").on(table.userId),
		index("two_factor_secret_idx").on(table.secret),
	],
);

export const fileNotes = sqliteTable(
	"file_notes",
	{
		id: text("id").primaryKey(),
		fileId: text("file_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		body: text("body").notNull(),
		timestampSeconds: real("timestamp_seconds"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("file_notes_fileId_idx").on(table.fileId),
		index("file_notes_userId_idx").on(table.userId),
	],
);

// =========================================================================
// FOLDERS
// =========================================================================

export const folders = sqliteTable(
	"folders",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		ownerId: text("owner_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		/** Storage key relative to user root, e.g. "folder-uuid" or "parent-uuid/child-uuid" */
		path: text("path").notNull(),
		/** Mounted volume, or null for the user's own drive. */
		volumeId: text("volume_id"),
		parentId: text("parent_id"),
		isTrashed: integer("is_trashed", { mode: "boolean" })
			.default(false)
			.notNull(),
		isStarred: integer("is_starred", { mode: "boolean" })
			.default(false)
			.notNull(),
		tags: text("tags", { mode: "json" })
			.$type<string[]>()
			.default([])
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("folders_ownerId_idx").on(table.ownerId),
		index("folders_parentId_idx").on(table.parentId),
		index("folders_path_ownerId_idx").on(table.path, table.ownerId),
		index("folders_volumeId_idx").on(table.volumeId),
	],
);

// =========================================================================
// FILES
// =========================================================================

export const files = sqliteTable(
	"files",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		ownerId: text("owner_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		/** Storage key relative to user root, e.g. "uuid.txt" or "folder-uuid/uuid.txt" */
		path: text("path").notNull(),
		/** Mounted volume, or null for the user's own drive. */
		volumeId: text("volume_id"),
		folderId: text("folder_id").references(() => folders.id, {
			onDelete: "set null",
		}),
		contentType: text("content_type")
			.default("application/octet-stream")
			.notNull(),
		category: text("category").default("UNKNOWN").notNull(),
		size: integer("size", { mode: "number" }).default(0).notNull(),
		isTrashed: integer("is_trashed", { mode: "boolean" })
			.default(false)
			.notNull(),
		isStarred: integer("is_starred", { mode: "boolean" })
			.default(false)
			.notNull(),
		tags: text("tags", { mode: "json" })
			.$type<string[]>()
			.default([])
			.notNull(),
		musicDuration: real("music_duration"),
		videoDuration: real("video_duration"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("files_ownerId_idx").on(table.ownerId),
		index("files_folderId_idx").on(table.folderId),
		index("files_path_ownerId_idx").on(table.path, table.ownerId),
		index("files_volumeId_idx").on(table.volumeId),
	],
);
