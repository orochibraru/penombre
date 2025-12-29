import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", () => ({
	id: text("id").notNull().primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull(),
}));

export const session = pgTable("session", () => ({
	id: text().notNull().primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => new Date())
		.notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}));

export const account = pgTable("account", () => ({
	id: text().notNull().primaryKey(),
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
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => new Date())
		.notNull(),
}));

export const verification = pgTable("verification", () => ({
	id: text().notNull().primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
		.notNull(),
}));

export const activity = pgTable("activity", (t) => ({
	id: t.uuid().notNull().primaryKey().defaultRandom(),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" })
		.notNull(),
	action: text("action", {
		enum: ["create", "update", "delete", "share"],
	}).notNull(),
	message: text("message").notNull(),
	link: text("link"),
	level: text("level", { enum: ["info", "warning", "error"] }).notNull(),
	createdAt: timestamp("created_at")
		.$defaultFn(() => new Date())
		.notNull(),
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
