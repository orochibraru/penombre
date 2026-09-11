import { count, eq } from "drizzle-orm";
import { Logger } from "$lib/logger";
import type { AuthType } from "$lib/server/auth";
import { auth } from "$lib/server/auth";
import { isAuthBypassed } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";

const logger = new Logger("auth:seed");

/** The owner every request runs as when authentication is switched off. */
const BYPASS_OWNER_EMAIL = "local@penombre.internal";

async function userCount(): Promise<number> {
	const db = getDb();
	const [row] = await db.select({ total: count() }).from(user);
	return Number(row?.total ?? 0);
}

/**
 * Whether the instance still needs its first administrator.
 *
 * There are no seeded credentials: an empty database means the setup screen,
 * not an account whose password is printed in the documentation. Auth bypass
 * is exempt — nobody signs in there, so there is nothing to set up.
 */
export async function needsSetup(): Promise<boolean> {
	if (isAuthBypassed()) {
		return false;
	}
	try {
		return (await userCount()) === 0;
	} catch {
		// Before migrations have run there is no table to count; the caller
		// treats that as "not yet", and boot re-checks after migrating.
		return false;
	}
}

/**
 * Create the first administrator.
 *
 * Refuses once any account exists, which is what stops the setup screen from
 * being a permanent back door: it is reachable exactly once, on an empty
 * instance.
 */
export async function createFirstAdmin(input: {
	email: string;
	password: string;
	name?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
	if ((await userCount()) > 0) {
		return { ok: false, error: "This instance already has an account." };
	}

	const db = getDb();
	const res = await auth.api.createUser({
		body: {
			email: input.email,
			password: input.password,
			name: input.name?.trim() || "Admin",
			role: "admin",
		},
	});

	if (!res.user) {
		return { ok: false, error: "Could not create the account." };
	}

	// Nobody is going to click a verification link for the account that owns
	// the instance, and an unverified admin cannot invite anyone.
	await db
		.update(user)
		.set({ emailVerified: true })
		.where(eq(user.id, res.user.id));

	logger.info("First administrator created.");
	return { ok: true };
}

/** Promote a lone account to admin, so an instance is never left without one. */
async function bumpSingleUserToAdmin(): Promise<void> {
	const db = getDb();
	const users = await db.select().from(user);
	if (users.length !== 1) {
		return;
	}
	const existing = users[0] as AuthType["user"];
	if (!existing || existing.role === "admin") {
		return;
	}
	logger.info("Bumping the only account to admin.");
	await db.update(user).set({ role: "admin" }).where(eq(user.id, existing.id));
}

/**
 * Boot-time account housekeeping.
 *
 * No longer creates an administrator — that is the setup screen's job. It only
 * ensures auth-bypass instances have an owner to attribute files to, and that
 * a single-account instance has admin rights.
 */
export async function seedAuth(): Promise<void> {
	if (isAuthBypassed()) {
		if ((await userCount()) > 0) {
			return;
		}
		// Deliberately credential-less: authentication is off, so a password
		// would be an unused secret rather than a protection.
		logger.info("Auth bypass: creating the shared local owner.");
		await auth.api.createUser({
			body: {
				email: BYPASS_OWNER_EMAIL,
				password: crypto.randomUUID(),
				name: "Local",
				role: "admin",
			},
		});
		return;
	}

	if (await needsSetup()) {
		logger.info("No accounts yet — the setup screen will create the first.");
		return;
	}

	await bumpSingleUserToAdmin();
}
