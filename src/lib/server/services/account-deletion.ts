/**
 * Guards for self-service account deletion (`user.deleteUser.beforeDelete`
 * in `auth/index.ts`). Kept out of that file so the check can be unit tested
 * without dragging in `betterAuth()`'s top-level construction.
 */

import { eq, sql } from "drizzle-orm";
import { type Database, getDb } from "#lib/server/db/index.js";
import { drives, user } from "#lib/server/db/schema.js";

export class LastAdminError extends Error {}
export class OwnsSharedDriveError extends Error {}

/**
 * Blocks a self-deletion that would strand the instance: the last admin
 * deleting themselves, or an owner deleting a shared drive out from under
 * its members. Metadata cascades away with the account either way: files,
 * folders, shares and sharings all reference `user.id` with
 * `onDelete: "cascade"`. The bytes are what `cleanupDeletedUserStorage`
 * (the hourly user-storage sweep) picks up afterward.
 */
export async function assertCanDeleteAccount(
	target: { id: string; role?: string | null },
	database: Database = getDb(),
): Promise<void> {
	if (target.role === "admin") {
		const [row] = await database
			.select({ count: sql<number>`count(*)` })
			.from(user)
			.where(eq(user.role, "admin"));
		if (Number(row?.count ?? 0) <= 1) {
			throw new LastAdminError(
				"The last administrator cannot delete their own account.",
			);
		}
	}

	const [ownedDrive] = await database
		.select({ id: drives.id })
		.from(drives)
		.where(eq(drives.ownerId, target.id))
		.limit(1);
	if (ownedDrive) {
		throw new OwnsSharedDriveError(
			"Delete or hand off your shared drives before deleting your account.",
		);
	}
}
