/**
 * User-to-user sharing: granting named accounts access to a file or folder.
 *
 * Distinct from `ShareService`, which mints anonymous capability URLs. Here
 * the grant is addressed to a user id, survives them signing out, and is
 * revoked per-person rather than per-link.
 *
 * One `sharings` row holds the resource and its permission; one `shared_with`
 * row per recipient hangs off it. That shape comes from the existing schema.
 */

import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { getDb } from "#lib/server/db/index.js";
import {
	files,
	folders,
	sharedWith,
	sharings,
	user,
} from "#lib/server/db/schema.js";
import { ancestorFolders } from "#lib/server/services/storage/mappers.js";

const logger = new Logger("SharingService");

export type SharePermission = "read" | "write" | "admin";

/** The fields it is safe to show one user about another. */
export interface Recipient {
	id: string;
	name: string;
	email: string;
	image: string | null;
}

export interface ResourceShare {
	sharingId: string;
	sharedWithId: string;
	permission: SharePermission;
	expiration: string | null;
	user: Recipient;
}

export class SharingService {
	private readonly db = getDb();

	/** Name of the resource if `ownerId` owns it, else null. */
	private async ownedName(
		ownerId: string,
		resourceType: "file" | "folder",
		resourceId: string,
	): Promise<string | null> {
		const table = resourceType === "folder" ? folders : files;
		const [row] = await this.db
			.select({ name: table.name })
			.from(table)
			.where(and(eq(table.id, resourceId), eq(table.ownerId, ownerId)));
		return row?.name ?? null;
	}

	/**
	 * Find people to share with. Requires a query and matches on email or
	 * name — the whole directory is not something one user may enumerate.
	 */
	searchUsers(
		query: string,
		excludeUserId: string,
		limit = 10,
	): Promise<Recipient[]> {
		const trimmed = query.trim();
		// Under 3 characters, or a wildcard-only query, turns this into a
		// directory dump; one page at a time, but a dump all the same.
		if (trimmed.length < 3) {
			return Promise.resolve([]);
		}
		// `%`/`_` are LIKE metacharacters; a caller typing either must search
		// for the literal character, not widen the match.
		const escaped = trimmed.replace(/[%_\\]/g, (c) => `\\${c}`);
		const term = `%${escaped.toLowerCase()}%`;
		return this.db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			})
			.from(user)
			.where(
				and(
					ne(user.id, excludeUserId),
					or(
						sql`lower(${user.email}) like ${term} escape '\'`,
						sql`lower(${user.name}) like ${term} escape '\'`,
					),
				),
			)
			.limit(limit);
	}

	/**
	 * Grant `userIds` access to a resource the caller owns.
	 *
	 * Permissions live on the `sharings` row, so one row is reused per
	 * (resource, permission) pair and recipients are added to it — sharing the
	 * same file with two people at "read" does not create two sharings.
	 */
	async share(input: {
		ownerId: string;
		resourceType: "file" | "folder";
		resourceId: string;
		userIds: string[];
		permission: SharePermission;
		/**
		 * Called with the people who were actually newly granted access, and
		 * the resource's name. A callback rather than a richer return value so
		 * the boolean contract every caller and test already relies on stays
		 * put — and so nobody is told twice when a share is re-sent to someone
		 * who already had it.
		 */
		onShared?: (granted: {
			userIds: string[];
			resourceName: string;
		}) => Promise<void>;
	}): Promise<boolean> {
		const { ownerId, resourceType, resourceId, userIds } = input;
		if (userIds.length === 0) {
			return true;
		}

		const resourceName = await this.ownedName(
			ownerId,
			resourceType,
			resourceId,
		);
		if (resourceName === null) {
			logger.warn(
				`Refusing sharing: ${resourceType} ${resourceId} not owned by ${ownerId}`,
			);
			return false;
		}

		// Never share with yourself, and never with an id that isn't a real user.
		const recipients = await this.db
			.select({ id: user.id })
			.from(user)
			.where(and(inArray(user.id, userIds), ne(user.id, ownerId)));
		if (recipients.length === 0) {
			return false;
		}

		const sharingId = await this.sharingRowFor(input);

		// A person already on this sharing must not be added twice.
		const existing = await this.db
			.select({ userId: sharedWith.userId })
			.from(sharedWith)
			.where(eq(sharedWith.sharingId, sharingId));
		const already = new Set(existing.map((row) => row.userId));

		const toAdd = recipients.filter((r) => !already.has(r.id));
		if (toAdd.length > 0) {
			await this.db
				.insert(sharedWith)
				.values(toAdd.map((r) => ({ sharingId, userId: r.id })));

			// Never allowed to fail the share it is reporting on.
			await input
				.onShared?.({
					userIds: toAdd.map((r) => r.id),
					resourceName,
				})
				.catch((error) => {
					logger.warn("Could not announce a new share", error);
				});
		}

		// The same person at a different permission would otherwise keep both.
		await this.dropOtherPermissions({
			ownerId,
			resourceType,
			resourceId,
			keepSharingId: sharingId,
			userIds: recipients.map((r) => r.id),
		});

		return true;
	}

	/** The sharing row for this (resource, permission), created if absent. */
	private async sharingRowFor({
		ownerId,
		resourceType,
		resourceId,
		permission,
	}: {
		ownerId: string;
		resourceType: "file" | "folder";
		resourceId: string;
		permission: SharePermission;
	}): Promise<string> {
		const [existing] = await this.db
			.select({ id: sharings.id })
			.from(sharings)
			.where(
				and(
					eq(sharings.ownerId, ownerId),
					eq(sharings.resourceType, resourceType),
					eq(sharings.resourceId, resourceId),
					eq(sharings.permission, permission),
				),
			);
		if (existing) {
			return existing.id;
		}

		const [created] = await this.db
			.insert(sharings)
			.values({ ownerId, resourceType, resourceId, permission })
			.returning({ id: sharings.id });
		return created!.id;
	}

	/**
	 * Remove these users from every *other* sharing of the same resource, so
	 * changing someone's permission replaces it instead of stacking a second
	 * grant they'd keep forever.
	 */
	private async dropOtherPermissions({
		ownerId,
		resourceType,
		resourceId,
		keepSharingId,
		userIds,
	}: {
		ownerId: string;
		resourceType: "file" | "folder";
		resourceId: string;
		keepSharingId: string;
		userIds: string[];
	}): Promise<void> {
		if (userIds.length === 0) {
			return;
		}
		const siblings = await this.db
			.select({ id: sharings.id })
			.from(sharings)
			.where(
				and(
					eq(sharings.ownerId, ownerId),
					eq(sharings.resourceType, resourceType),
					eq(sharings.resourceId, resourceId),
					ne(sharings.id, keepSharingId),
				),
			);
		if (siblings.length === 0) {
			return;
		}
		await this.db.delete(sharedWith).where(
			and(
				inArray(
					sharedWith.sharingId,
					siblings.map((s) => s.id),
				),
				inArray(sharedWith.userId, userIds),
			),
		);
	}

	/** Everyone a resource is currently shared with. */
	async listForResource(
		ownerId: string,
		resourceType: "file" | "folder",
		resourceId: string,
	): Promise<ResourceShare[]> {
		const rows = await this.db
			.select({
				sharingId: sharings.id,
				sharedWithId: sharedWith.id,
				permission: sharings.permission,
				expiration: sharings.expiration,
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			})
			.from(sharings)
			.innerJoin(sharedWith, eq(sharedWith.sharingId, sharings.id))
			.innerJoin(user, eq(user.id, sharedWith.userId))
			.where(
				and(
					eq(sharings.ownerId, ownerId),
					eq(sharings.resourceType, resourceType),
					eq(sharings.resourceId, resourceId),
				),
			);

		return rows.map((row) => ({
			sharingId: row.sharingId,
			sharedWithId: row.sharedWithId,
			permission: row.permission,
			expiration: row.expiration?.toISOString() ?? null,
			user: { id: row.id, name: row.name, email: row.email, image: row.image },
		}));
	}

	/** Revoke one person's access. Scoped to the owner. */
	async revoke(ownerId: string, sharedWithId: string): Promise<boolean> {
		const [row] = await this.db
			.select({ sharingId: sharedWith.sharingId })
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.where(
				and(eq(sharedWith.id, sharedWithId), eq(sharings.ownerId, ownerId)),
			);
		if (!row) {
			return false;
		}
		await this.db.delete(sharedWith).where(eq(sharedWith.id, sharedWithId));

		// A sharing with nobody on it is dead weight.
		const remaining = await this.db
			.select({ id: sharedWith.id })
			.from(sharedWith)
			.where(eq(sharedWith.sharingId, row.sharingId));
		if (remaining.length === 0) {
			await this.db.delete(sharings).where(eq(sharings.id, row.sharingId));
		}
		return true;
	}

	/**
	 * Everything other people have shared with this user.
	 *
	 * Joined to `files`/`folders` separately because the two live in different
	 * tables; trashed items are dropped, since the owner putting something in
	 * the bin should not keep serving it to everyone it was shared with.
	 */
	async listSharedWithMe(userId: string) {
		const base = this.db
			.select({
				sharingId: sharings.id,
				sharedWithId: sharedWith.id,
				resourceType: sharings.resourceType,
				resourceId: sharings.resourceId,
				permission: sharings.permission,
				createdAt: sharedWith.createdAt,
				ownerName: user.name,
				ownerEmail: user.email,
			})
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.innerJoin(user, eq(user.id, sharings.ownerId))
			.where(eq(sharedWith.userId, userId));

		const rows = await base;
		if (rows.length === 0) {
			return [];
		}

		const fileIds = rows
			.filter((r) => r.resourceType === "file")
			.map((r) => r.resourceId);
		const folderIds = rows
			.filter((r) => r.resourceType === "folder")
			.map((r) => r.resourceId);

		const [fileRows, folderRows] = await Promise.all([
			fileIds.length
				? this.db
						.select({
							id: files.id,
							name: files.name,
							size: files.size,
							category: files.category,
						})
						.from(files)
						.where(and(inArray(files.id, fileIds), eq(files.isTrashed, false)))
				: Promise.resolve([]),
			folderIds.length
				? this.db
						.select({ id: folders.id, name: folders.name })
						.from(folders)
						.where(
							and(inArray(folders.id, folderIds), eq(folders.isTrashed, false)),
						)
				: Promise.resolve([]),
		]);

		const names = new Map<
			string,
			{ name: string; size: number; category: string }
		>();
		for (const f of fileRows) {
			names.set(f.id, {
				name: f.name,
				size: Number(f.size),
				category: f.category,
			});
		}
		for (const f of folderRows) {
			names.set(f.id, { name: f.name, size: 0, category: "FOLDER" });
		}

		return rows
			.filter((row) => names.has(row.resourceId))
			.map((row) => {
				const meta = names.get(row.resourceId)!;
				return {
					sharingId: row.sharingId,
					sharedWithId: row.sharedWithId,
					resourceType: row.resourceType,
					resourceId: row.resourceId,
					permission: row.permission,
					name: meta.name,
					size: meta.size,
					category: meta.category,
					sharedAt: row.createdAt.toISOString(),
					owner: { name: row.ownerName, email: row.ownerEmail },
				};
			});
	}

	/**
	 * Of `userIds`, who still has `fileId` shared with them; directly, or
	 * through an ancestor folder.
	 *
	 * A note thread outlives the share it started under: a revoked sharee, or
	 * one dropped from a folder share, must stop being notified even though
	 * they are still in `noteParticipants`.
	 */
	async canReachFile(
		ownerId: string,
		fileId: string,
		userIds: string[],
	): Promise<string[]> {
		if (userIds.length === 0) {
			return [];
		}
		const [file] = await this.db
			.select({ path: files.path })
			.from(files)
			.where(and(eq(files.id, fileId), eq(files.ownerId, ownerId)));
		if (!file) {
			return [];
		}

		// A folder's path is its own id appended to its parent's, so the last
		// segment of every ancestor path *is* that ancestor's id: no lookup
		// needed to turn "which folders contain this file" into ids to filter
		// grants on.
		const folderIds = ancestorFolders(file.path).map(
			(path) => path.split("/").at(-1) as string,
		);
		const grantsOnThisResource = [
			and(eq(sharings.resourceType, "file"), eq(sharings.resourceId, fileId)),
			...(folderIds.length > 0
				? [
						and(
							eq(sharings.resourceType, "folder"),
							inArray(sharings.resourceId, folderIds),
						),
					]
				: []),
		];

		// Filtered by resource in SQL, not loaded in full and sifted in JS: an
		// owner who has shared thousands of other things with the same
		// recipients must not pay for those grants to answer about one file.
		const rows = await this.db
			.select({ userId: sharedWith.userId })
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.where(
				and(
					eq(sharings.ownerId, ownerId),
					inArray(sharedWith.userId, userIds),
					or(...grantsOnThisResource),
				),
			);
		// A folder grant and a file grant can both match the same recipient.
		return [...new Set(rows.map((row) => row.userId))];
	}

	/**
	 * The owner of a resource shared with `userId`, or null when it is not.
	 * The download route needs this to serve bytes as the owner.
	 */
	async resolveAccess(userId: string, sharedWithId: string) {
		const [row] = await this.db
			.select({
				ownerId: sharings.ownerId,
				resourceType: sharings.resourceType,
				resourceId: sharings.resourceId,
				permission: sharings.permission,
			})
			.from(sharedWith)
			.innerJoin(sharings, eq(sharings.id, sharedWith.sharingId))
			.where(
				and(eq(sharedWith.id, sharedWithId), eq(sharedWith.userId, userId)),
			);
		return row ?? null;
	}
}
