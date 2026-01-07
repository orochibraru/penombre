import { Log } from "@kitql/helpers";
import type { User } from "better-auth";
import { eq } from "drizzle-orm";
import { auth } from "$lib/server/auth";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";

const logger = new Log("auth-seed");

export const defaultEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
export const defaultPassword = process.env.ADMIN_PASSWORD ?? "admin";

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

	return users.length === 1;
}

export async function seedAuth() {
	const db = getDb();
	const exists = await defaultUserExists();
	if (exists) {
		logger.info("Default user already exists. Skipping seeding.");
		if (await shouldBumpUserRole()) {
			logger.info("Bumping existing user to admin role...");
			const users = await db.select().from(user);
			const existingUser = users[0] as User;
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
		}
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
