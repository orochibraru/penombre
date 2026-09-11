/**
 * Storage statistics: what a user is using, what the disk has left, and
 * what is worth cleaning up.
 *
 * Everything here is a read-only aggregate over the metadata tables plus one
 * `statfs`/`df` call — no walking of the object store, so it stays cheap on a
 * large library.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { getStoragePath } from "$lib/server/config";
import { getDb } from "$lib/server/db";
import { activity, files, shares, user } from "$lib/server/db/schema";
import { diskSpace } from "./storage/disk-space";

/** How many "biggest file" rows a cleanup panel shows. */
const CLEANUP_LIMIT = 10;

export interface CategoryUsage {
	category: string;
	bytes: number;
	count: number;
}

export interface CleanupCandidate {
	id: string;
	name: string;
	size: number;
	updatedAt: Date;
}

export interface StorageStats {
	/** Bytes of live (non-trashed) files owned by the user. */
	used: number;
	fileCount: number;
	/** Bytes held by trashed files — reclaimed by emptying the trash. */
	trashedBytes: number;
	trashedCount: number;
	byCategory: CategoryUsage[];
	largestFiles: CleanupCandidate[];
	/** Filesystem numbers for the volume backing the storage root. */
	disk: { total: number; available: number };
}

export interface InstanceStats {
	userCount: number;
	fileCount: number;
	totalBytes: number;
	trashedBytes: number;
	shareCount: number;
	activityCount: number;
	disk: { total: number; available: number };
	/** Per-user usage, biggest first. */
	perUser: Array<{
		id: string;
		name: string;
		email: string;
		bytes: number;
		fileCount: number;
	}>;
}

export class StatsService {
	private readonly db = getDb();

	/** Usage for one user's drive. */
	async forUser(userId: string): Promise<StorageStats> {
		const owned = eq(files.ownerId, userId);

		const [live, trashed, byCategory, largestFiles] = await Promise.all([
			this.db
				.select({
					bytes: sql<number>`coalesce(sum(${files.size}), 0)`,
					count: sql<number>`count(*)`,
				})
				.from(files)
				.where(and(owned, eq(files.isTrashed, false))),
			this.db
				.select({
					bytes: sql<number>`coalesce(sum(${files.size}), 0)`,
					count: sql<number>`count(*)`,
				})
				.from(files)
				.where(and(owned, eq(files.isTrashed, true))),
			this.db
				.select({
					category: files.category,
					bytes: sql<number>`coalesce(sum(${files.size}), 0)`,
					count: sql<number>`count(*)`,
				})
				.from(files)
				.where(and(owned, eq(files.isTrashed, false)))
				.groupBy(files.category),
			this.db
				.select({
					id: files.id,
					name: files.name,
					size: files.size,
					updatedAt: files.updatedAt,
				})
				.from(files)
				.where(and(owned, eq(files.isTrashed, false)))
				.orderBy(desc(files.size))
				.limit(CLEANUP_LIMIT),
		]);

		return {
			used: Number(live[0]?.bytes ?? 0),
			fileCount: Number(live[0]?.count ?? 0),
			trashedBytes: Number(trashed[0]?.bytes ?? 0),
			trashedCount: Number(trashed[0]?.count ?? 0),
			byCategory: byCategory
				.map((row) => ({
					category: row.category,
					bytes: Number(row.bytes),
					count: Number(row.count),
				}))
				.sort((a, b) => b.bytes - a.bytes),
			largestFiles: largestFiles.map((f) => ({
				...f,
				size: Number(f.size),
			})),
			disk: diskSpace(getStoragePath()),
		};
	}

	/** Instance-wide totals for the admin dashboard. */
	async forInstance(): Promise<InstanceStats> {
		const [users, totals, trashed, shareRows, activityRows, perUserRows] =
			await Promise.all([
				this.db.select({ count: sql<number>`count(*)` }).from(user),
				this.db
					.select({
						bytes: sql<number>`coalesce(sum(${files.size}), 0)`,
						count: sql<number>`count(*)`,
					})
					.from(files)
					.where(eq(files.isTrashed, false)),
				this.db
					.select({ bytes: sql<number>`coalesce(sum(${files.size}), 0)` })
					.from(files)
					.where(eq(files.isTrashed, true)),
				this.db.select({ count: sql<number>`count(*)` }).from(shares),
				this.db.select({ count: sql<number>`count(*)` }).from(activity),
				this.db
					.select({
						id: user.id,
						name: user.name,
						email: user.email,
						bytes: sql<number>`coalesce(sum(${files.size}), 0)`,
						fileCount: sql<number>`count(${files.id})`,
					})
					.from(user)
					.leftJoin(
						files,
						and(eq(files.ownerId, user.id), eq(files.isTrashed, false)),
					)
					.groupBy(user.id, user.name, user.email),
			]);

		return {
			userCount: Number(users[0]?.count ?? 0),
			fileCount: Number(totals[0]?.count ?? 0),
			totalBytes: Number(totals[0]?.bytes ?? 0),
			trashedBytes: Number(trashed[0]?.bytes ?? 0),
			shareCount: Number(shareRows[0]?.count ?? 0),
			activityCount: Number(activityRows[0]?.count ?? 0),
			disk: diskSpace(getStoragePath()),
			perUser: perUserRows
				.map((row) => ({
					id: row.id,
					name: row.name,
					email: row.email,
					bytes: Number(row.bytes),
					fileCount: Number(row.fileCount),
				}))
				.sort((a, b) => b.bytes - a.bytes),
		};
	}
}
