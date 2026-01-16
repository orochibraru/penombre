import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
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

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
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

export const activity = pgTable("activity", (t) => ({
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
}));

export const activityRelations = relations(activity, ({ one }) => ({
	user: one(user, {
		fields: [activity.userId],
		references: [user.id],
	}),
}));

export const sharings = pgTable("sharings", (t) => ({
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
}));

export const sharingRelations = relations(sharings, ({ one, many }) => ({
	owner: one(user, {
		fields: [sharings.ownerId],
		references: [user.id],
	}),
	sharedWith: many(sharedWith),
}));

export const sharedWith = pgTable("shared_with", (t) => ({
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
}));

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
