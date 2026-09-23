/**
 * Public links (`shares`) and named-user grants (`sharings`) outlive the
 * file or folder they point at unless something deletes them here;
 * `resource_id` is polymorphic (a file or a folder id depending on
 * `resource_type`), so a real foreign key can't do it for us. `shared_with`
 * cascades off `sharings.id` already, so deleting the `sharings` row is
 * enough to take its recipients with it.
 */

import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "#lib/server/db/index.js";
import { shares, sharings } from "#lib/server/db/schema.js";

/** SQLite caps bound parameters per statement; delete ids in slices. */
const CHUNK = 500;

function chunks<T>(items: T[], size = CHUNK): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

export async function purgeGrantsFor(
	db: ReturnType<typeof getDb>,
	resourceType: "file" | "folder",
	resourceIds: readonly string[],
): Promise<void> {
	if (resourceIds.length === 0) {
		return;
	}
	for (const ids of chunks([...resourceIds])) {
		await db
			.delete(shares)
			.where(
				and(
					eq(shares.resourceType, resourceType),
					inArray(shares.resourceId, ids),
				),
			);
		await db
			.delete(sharings)
			.where(
				and(
					eq(sharings.resourceType, resourceType),
					inArray(sharings.resourceId, ids),
				),
			);
	}
}
