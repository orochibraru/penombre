import { describe, expect, test } from "bun:test";
import { files, user } from "#lib/server/db/schema.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";
import { type Root, sweepMissingDurations } from "./duration-sweep";

describe("sweepMissingDurations", () => {
	// Full-mode drives and shared drives are never library-scanned; this is
	// the only thing that retries a duration their upload failed to record.
	test("visits every root holding a media row with no duration, once each", async () => {
		const database = migratedSqlite();
		for (const id of ["alice", "bob"]) {
			await database.insert(user).values({ id, name: id, email: `${id}@x` });
		}
		const add = (
			id: string,
			ownerId: string,
			volumeId: string | null,
			extra = {},
		) =>
			database.insert(files).values({
				id,
				name: id,
				path: id,
				category: "MUSIC",
				ownerId,
				volumeId,
				...extra,
			});
		await add("a1", "alice", null);
		await add("a2", "alice", null);
		await add("a3", "alice", "drive:d1");
		await add("b1", "bob", null, { musicDuration: 3 });
		await add("b2", "bob", "media", { category: "DOCUMENTS" });

		const visited: Root[] = [];
		await sweepMissingDurations(database, async (_db, root) => {
			visited.push(root);
			return { probeMissingDurations: async () => {} };
		});

		expect(visited).toHaveLength(2);
		expect(visited).toContainEqual({ ownerId: "alice", volumeId: null });
		expect(visited).toContainEqual({ ownerId: "alice", volumeId: "drive:d1" });
	});

	test("never throws", async () => {
		const database = migratedSqlite();
		await database.insert(user).values({ id: "a", name: "a", email: "a@x" });
		await database.insert(files).values({
			id: "f",
			name: "f",
			path: "f",
			category: "MUSIC",
			ownerId: "a",
		});
		await expect(
			sweepMissingDurations(database, async () => {
				throw new Error("boom");
			}),
		).resolves.toBeUndefined();
	});
});
