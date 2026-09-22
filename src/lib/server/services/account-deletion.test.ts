import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "#lib/server/db/index.js";
import { drives, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import {
	assertCanDeleteAccount,
	LastAdminError,
	OwnsSharedDriveError,
} from "./account-deletion";

let database: Database;

beforeEach(() => {
	database = migratedSqlite();
});

describe("assertCanDeleteAccount", () => {
	test("an ordinary user with no shared drive may delete themselves", async () => {
		await database
			.insert(user)
			.values({ id: "u1", name: "Alice", email: "a@x.test", role: "user" });

		await expect(
			assertCanDeleteAccount({ id: "u1", role: "user" }, database),
		).resolves.toBeUndefined();
	});

	test("refuses the last administrator", async () => {
		await database.insert(user).values({
			id: "admin1",
			name: "Admin",
			email: "a@x.test",
			role: "admin",
		});

		await expect(
			assertCanDeleteAccount({ id: "admin1", role: "admin" }, database),
		).rejects.toBeInstanceOf(LastAdminError);
	});

	test("allows an admin to delete themselves when another admin remains", async () => {
		await database.insert(user).values([
			{ id: "admin1", name: "Admin 1", email: "a1@x.test", role: "admin" },
			{ id: "admin2", name: "Admin 2", email: "a2@x.test", role: "admin" },
		]);

		await expect(
			assertCanDeleteAccount({ id: "admin1", role: "admin" }, database),
		).resolves.toBeUndefined();
	});

	test("refuses an owner of a shared drive", async () => {
		await database
			.insert(user)
			.values({ id: "u1", name: "Alice", email: "a@x.test", role: "user" });
		await database
			.insert(drives)
			.values({ id: "d1", name: "Team drive", ownerId: "u1" });

		await expect(
			assertCanDeleteAccount({ id: "u1", role: "user" }, database),
		).rejects.toBeInstanceOf(OwnsSharedDriveError);
	});
});
