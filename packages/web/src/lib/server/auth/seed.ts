import { eq } from "drizzle-orm";
import { Logger } from "$lib/logger";
import type { AuthType } from "$lib/server/auth";
import { auth } from "$lib/server/auth";
import { getOpendriveConfig } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";

const logger = new Logger("auth:seed");

const config = getOpendriveConfig();

export const defaultEmail = config.auth.defaultAdminCredentials.email;
export const defaultPassword = config.auth.defaultAdminCredentials.password;

async function defaultUserExists(): Promise<boolean> {
	const db = getDb();
	const users = await db.select().from(user);

	if (!users) {
		return false;
	}

	return users.length > 0;
}

async function shouldBumpUserRole(): Promise<boolean> {
	const db = getDb();
	const users = await db.select().from(user);

	if (!users) {
		return false;
	}

	const singleUser = users.length === 1;

	if (!singleUser) {
		return false;
	}

	const existingUser = users[0] as AuthType["user"];
	// biome-ignore lint/style/noNonNullAssertion: The type is incorrect here
	const isNotAdmin = existingUser!.role !== "admin";

	return isNotAdmin;
}

export async function seedAuth(): Promise<void> {
	const db = getDb();
	const exists = await defaultUserExists();
	if (exists) {
		logger.info("Default user already exists. Skipping seeding.");

		const shouldBump = await shouldBumpUserRole();

		if (!shouldBump) {
			return;
		}

		logger.info("Bumping existing user to admin role...");
		const users = await db.select().from(user);
		const existingUser = users[0] as AuthType["user"];
		if (!existingUser) {
			logger.error("No existing user found to bump to admin role");
			throw new Error("No existing user found to bump to admin role");
		}
		const updateQuery = await db
			.update(user)
			.set({ role: "admin" })
			.where(eq(user.id, existingUser.id))
			.returning();
		if (updateQuery.length === 0) {
			logger.error("Failed to bump existing user to admin role");
			throw new Error("Failed to bump existing user to admin role");
		}
		logger.info("Existing user bumped to admin role.");
		return;
	}

	logger.info("Creating default user...");

	const res = await auth.api.createUser({
		body: {
			email: defaultEmail,
			password: defaultPassword,
			name: "Admin User",
			role: "admin",
		},
	});

	if (!res.user) {
		logger.error("Failed to create default user");
		throw new Error("Failed to create default user");
	}

	logger.info("Default user created. Verifying email...");
	const verifyQuery = await db
		.update(user)
		.set({ emailVerified: true })
		.where(eq(user.id, res.user.id))
		.returning();

	if (verifyQuery.length === 0) {
		logger.error("Failed to verify default user's email");
		throw new Error("Failed to verify default user's email");
	}

	logger.info("Default user created.");
}
