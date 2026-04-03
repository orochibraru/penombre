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
// USER PREFERENCES
// =========================================================================

export type UserPreferencesData = {
	layout?: "grid" | "list";
	sortColumn?: "name" | "size" | "updatedAt" | null;
	sortDirection?: "asc" | "desc";
};

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
		/** Storage key relative to user root, e.g. "folder-uuid" or "parent-uuid/child-uuid" */
		path: text("path").notNull(),
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
		/** Storage key relative to user root, e.g. "uuid.txt" or "folder-uuid/uuid.txt" */
		path: text("path").notNull(),
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
export type UserWithSession = {
	user: User;
	session: Session;
};
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Activity = typeof activity.$inferSelect;
export type Sharing = typeof sharings.$inferSelect;
export type SharedWith = typeof sharedWith.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Apikey = typeof apikey.$inferSelect;
export type Passkey = typeof passkey.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type File = typeof files.$inferSelect;
