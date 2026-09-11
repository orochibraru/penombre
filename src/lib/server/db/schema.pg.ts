import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	role: text("role"),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
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

export const account = pgTable(
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
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ one, many }) => ({
	sessions: many(session),
	accounts: many(account),
	activities: many(activity),
	ownedSharings: many(sharings),
	shares: many(shares),
	sharedWithMe: many(sharedWith),
	preferences: one(userPreferences),
	passkeys: many(passkey),
	apikeys: many(apikey),
	files: many(files),
	folders: many(folders),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const activity = pgTable(
	"activity",
	(t) => ({
		id: t.uuid().notNull().primaryKey().defaultRandom(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		action: text("action", {
			enum: ["create", "update", "delete", "share", "rename"],
		}).notNull(),
		message: text("message").notNull(),
		link: text("link"),
		level: text("level", { enum: ["info", "warning", "error"] }).notNull(),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
	}),
	(table) => [
		index("activity_userId_idx").on(table.userId),
		index("activity_createdAt_idx").on(table.createdAt),
	],
);

export const activityRelations = relations(activity, ({ one }) => ({
	user: one(user, {
		fields: [activity.userId],
		references: [user.id],
	}),
}));

export const sharings = pgTable(
	"sharings",
	(t) => ({
		id: t.uuid().notNull().primaryKey().defaultRandom(),
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
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date())
			.notNull(),
		expiration: timestamp("expiration"),
	}),
	(table) => [
		index("sharings_ownerId_idx").on(table.ownerId),
		index("sharings_resourceId_idx").on(table.resourceId),
	],
);

export const sharingRelations = relations(sharings, ({ one, many }) => ({
	owner: one(user, {
		fields: [sharings.ownerId],
		references: [user.id],
	}),
	sharedWith: many(sharedWith),
}));

export const sharedWith = pgTable(
	"shared_with",
	(t) => ({
		id: t.uuid().notNull().primaryKey().defaultRandom(),
		sharingId: t
			.uuid("sharing_id")
			.references(() => sharings.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
	}),
	(table) => [
		index("sharedWith_sharingId_idx").on(table.sharingId),
		index("sharedWith_userId_idx").on(table.userId),
	],
);

export const sharedWithRelations = relations(sharedWith, ({ one }) => ({
	sharing: one(sharings, {
		fields: [sharedWith.sharingId],
		references: [sharings.id],
	}),
	user: one(user, {
		fields: [sharedWith.userId],
		references: [user.id],
	}),
}));

// =========================================================================
// SHARE LINKS
// =========================================================================

/**
 * A shareable link to one file or folder. Distinct from `sharings`, which
 * grants named users access — a share link is anonymous, addressed only by
 * its unguessable `token`.
 */
export const shares = pgTable(
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
		requiresAuth: boolean("requires_auth").default(false).notNull(),
		/** Null means the link never expires. */
		expiresAt: timestamp("expires_at"),
		downloadCount: integer("download_count").default(0).notNull(),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("shares_ownerId_idx").on(table.ownerId),
		index("shares_token_idx").on(table.token),
	],
);

export const sharesRelations = relations(shares, ({ one }) => ({
	owner: one(user, {
		fields: [shares.ownerId],
		references: [user.id],
	}),
}));

// =========================================================================
// INSTANCE SETTINGS
// =========================================================================

/**
 * Runtime settings an admin can change without restarting.
 *
 * Single row, keyed by a constant id. Anything also settable by environment
 * variable stays env-owned — `config.ts` remains the source of truth for those,
 * and the admin UI shows them read-only. This table only holds what has no env
 * equivalent, so the two can never disagree.
 */
export interface AppSettingsData {
	/** Require every account to register a passkey. */
	requirePasskey?: boolean;
	/** Whether anyone may create an account unprompted. */
	allowSignups?: boolean;
	/** When signups are open, restrict them to these email domains. */
	allowedEmailDomains?: string[];
	/** Minimum password length enforced on top of the env floor. */
	minPasswordLength?: number;
	/** Require a mix of character classes in passwords. */
	requireStrongPassword?: boolean;
	/**
	 * OAuth providers added through the admin UI.
	 *
	 * Kept separate from the env-declared ones: `config.ts` owns those, and
	 * merging them into one editable list would give two sources of truth for
	 * the same provider name.
	 */
	/**
	 * Email + password sign-in. Only consulted when `ENABLE_EMAIL_SIGNIN` is
	 * absent from the environment — see `envProvided()`.
	 */
	emailSignInEnabled?: boolean;
	/**
	 * Passwordless sign-in by emailed link. Needs working SMTP; there is no
	 * environment variable for it, so the stored value always governs.
	 */
	magicLinkEnabled?: boolean;
	/** Passwordless sign-in by emailed one-time code. Also needs SMTP. */
	emailOtpEnabled?: boolean;
	/** Force every account to enrol in TOTP two-factor before using the app. */
	requireTwoFactor?: boolean;
	/** SMTP, used when `SMTP_ENABLED` is absent from the environment. */
	smtp?: {
		enabled?: boolean;
		host?: string;
		port?: number;
		user?: string;
		password?: string;
		from?: string;
		secure?: boolean;
	};
	oauthProviders?: Array<{
		name: string;
		prettyName?: string;
		clientId: string;
		clientSecret: string;
		discoveryUrl: string;
		scopes?: string[];
		pkce?: boolean;
		enabled?: boolean;
	}>;
}

export const appSettings = pgTable("app_settings", {
	id: text("id").primaryKey(),
	settings: jsonb("settings").$type<AppSettingsData>().default({}),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// =========================================================================
// USER PREFERENCES
// =========================================================================

export interface UserPreferencesData {
	layout?: "grid" | "list";
	sortColumn?: "name" | "size" | "updatedAt" | null;
	sortDirection?: "asc" | "desc";
	/** Interface typeface: the monospace default, or the system sans stack. */
	fontFamily?: "mono" | "sans";
	/** Corner treatment across the whole UI. */
	corners?: "boxy" | "rounded";
	/** Named accent, mapped to an oklch hue in `app.css`. */
	accent?: "purple" | "blue" | "teal" | "green" | "amber" | "rose";
	/**
	 * Set once the first-run walkthrough has been completed or skipped. Lives
	 * here rather than on `user` so inviting an account needs no migration.
	 */
	onboarded?: boolean;
}

export const userPreferences = pgTable("user_preferences", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	preferences: jsonb("preferences").$type<UserPreferencesData>().default({}),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const userPreferencesRelations = relations(
	userPreferences,
	({ one }) => ({
		user: one(user, {
			fields: [userPreferences.userId],
			references: [user.id],
		}),
	}),
);

export const apikey = pgTable("apikey", {
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
	lastRefillAt: timestamp("last_refill_at", {
		precision: 6,
		withTimezone: true,
	}),
	enabled: boolean("enabled").notNull(),
	rateLimitEnabled: boolean("rate_limit_enabled").notNull(),
	rateLimitTimeWindow: integer("rate_limit_time_window"),
	rateLimitMax: integer("rate_limit_max"),
	requestCount: integer("request_count").notNull(),
	remaining: integer("remaining"),
	lastRequest: timestamp("last_request", {
		precision: 6,
		withTimezone: true,
	}),
	expiresAt: timestamp("expires_at", { precision: 6, withTimezone: true }),
	createdAt: timestamp("created_at", {
		precision: 6,
		withTimezone: true,
	}).notNull(),
	updatedAt: timestamp("updated_at", {
		precision: 6,
		withTimezone: true,
	}).notNull(),
	permissions: text("permissions"),
	metadata: jsonb("metadata").default({}),
});

export const apikeyRelations = relations(apikey, ({ one }) => ({
	user: one(user, {
		fields: [apikey.referenceId],
		references: [user.id],
	}),
}));

export const passkey = pgTable("passkey", {
	id: text("id").primaryKey(),
	name: text("name"),
	publicKey: text("public_key").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	credentialID: text("credential_id").notNull(),
	counter: integer("counter").notNull(),
	deviceType: text("device_type").notNull(),
	backedUp: boolean("backed_up").notNull(),
	transports: text("transports"),
	createdAt: timestamp("created_at", { precision: 6, withTimezone: true }),
	aaguid: text("aaguid"),
});

/**
 * TOTP secret and backup codes, one row per enrolled account.
 *
 * Column names match what better-auth's two-factor plugin asks the adapter
 * for — `secret`, `backupCodes`, `verified`, `failedVerificationCount`,
 * `lockedUntil` — so renaming a property here silently breaks enrolment.
 */
export const twoFactor = pgTable(
	"two_factor",
	{
		id: text("id").primaryKey(),
		secret: text("secret").notNull(),
		backupCodes: text("backup_codes").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		verified: boolean("verified").default(true),
		failedVerificationCount: integer("failed_verification_count").default(0),
		lockedUntil: timestamp("locked_until"),
	},
	(table) => [
		index("two_factor_userId_idx").on(table.userId),
		index("two_factor_secret_idx").on(table.secret),
	],
);

/**
 * Notes attached to a file.
 *
 * `timestampSeconds` is what makes a note a comment on a moment rather than on
 * the file as a whole: null means "the file", a number means that point in an
 * audio or video track. Nothing enforces that the file is playable — a stray
 * timestamp on a PDF is harmless and the UI simply never sets one.
 */
export const fileNotes = pgTable(
	"file_notes",
	{
		id: text("id").primaryKey(),
		fileId: text("file_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		body: text("body").notNull(),
		timestampSeconds: real("timestamp_seconds"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("file_notes_fileId_idx").on(table.fileId),
		index("file_notes_userId_idx").on(table.userId),
	],
);

export const fileNotesRelations = relations(fileNotes, ({ one }) => ({
	user: one(user, {
		fields: [fileNotes.userId],
		references: [user.id],
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
	}),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id],
	}),
}));

// =========================================================================
// FOLDERS
// =========================================================================

export const folders = pgTable(
	"folders",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		ownerId: text("owner_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		/** Storage key relative to the volume root, e.g. "folder-uuid" or "parent-uuid/child-uuid" */
		path: text("path").notNull(),
		/**
		 * Which mounted volume this row lives on. Null is the user's own drive
		 * (or, in simple mode, the shared one) — the pre-volume default, so
		 * existing rows keep working untouched.
		 */
		volumeId: text("volume_id"),
		parentId: text("parent_id"),
		isTrashed: boolean("is_trashed").default(false).notNull(),
		isStarred: boolean("is_starred").default(false).notNull(),
		tags: text("tags").array().default([]).notNull(),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
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

export const foldersRelations = relations(folders, ({ one, many }) => ({
	owner: one(user, {
		fields: [folders.ownerId],
		references: [user.id],
	}),
	parent: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: "parentFolder",
	}),
	children: many(folders, { relationName: "parentFolder" }),
	files: many(files),
}));

// =========================================================================
// FILES
// =========================================================================

export const files = pgTable(
	"files",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		ownerId: text("owner_id")
			.references(() => user.id, { onDelete: "cascade" })
			.notNull(),
		/** Storage key relative to the volume root, e.g. "uuid.txt" or "folder-uuid/uuid.txt" */
		path: text("path").notNull(),
		/** Mounted volume, or null for the user's own drive. See `folders`. */
		volumeId: text("volume_id"),
		folderId: text("folder_id").references(() => folders.id, {
			onDelete: "set null",
		}),
		contentType: text("content_type")
			.default("application/octet-stream")
			.notNull(),
		category: text("category").default("UNKNOWN").notNull(),
		size: bigint("size", { mode: "number" }).default(0).notNull(),
		isTrashed: boolean("is_trashed").default(false).notNull(),
		isStarred: boolean("is_starred").default(false).notNull(),
		tags: text("tags").array().default([]).notNull(),
		musicDuration: real("music_duration"),
		videoDuration: real("video_duration"),
		createdAt: timestamp("created_at")
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: timestamp("updated_at")
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

export const filesRelations = relations(files, ({ one }) => ({
	owner: one(user, {
		fields: [files.ownerId],
		references: [user.id],
	}),
	folder: one(folders, {
		fields: [files.folderId],
		references: [folders.id],
	}),
}));

// =========================================================================
// INFERRED TYPES
// =========================================================================

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export interface UserWithSession {
	user: User;
	session: Session;
}
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Activity = typeof activity.$inferSelect;
export type Sharing = typeof sharings.$inferSelect;
export type Share = typeof shares.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type SharedWith = typeof sharedWith.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Apikey = typeof apikey.$inferSelect;
export type Passkey = typeof passkey.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type File = typeof files.$inferSelect;
