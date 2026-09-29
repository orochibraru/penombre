/**
 * Share links: anonymous, token-addressed access to one file or folder.
 *
 * Distinct from the `sharings` table, which grants named users access. A
 * share link is a capability URL — whoever holds the token gets whatever
 * the link allows, optionally narrowed by a password, an expiry, or a
 * "must be signed in" flag.
 */

import type { User } from "better-auth";
import { and, desc, eq, isNotNull, lte, or, sql } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";
import { getDb } from "#lib/server/db/index.js";
import {
	driveMembers,
	drives,
	files,
	folders,
	type Share,
	shares,
} from "#lib/server/db/schema.js";

const logger = new Logger("ShareService");

/** 32 hex chars from the CSPRNG — the entire secret of a share URL. */
function generateToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CreateShareInput {
	ownerId: string;
	resourceType: "file" | "folder";
	/** File/folder id, as stored in `files.id` / `folders.id`. */
	resourceId: string;
	password?: string;
	/** Days until the link stops working; omit or 0 for "never expires". */
	expiresInDays?: number;
	requiresAuth?: boolean;
}

/** The row a link resolves to: its tree is the row owner's, on its volume. */
export interface ShareableRow {
	name: string;
	ownerId: string;
	volumeId: string | null;
}

export type ShareAccess =
	| { ok: true; share: Share }
	| { ok: false; reason: "not-found" | "expired" | "auth" | "password" };

export class ShareService {
	private readonly db = getDb();

	/**
	 * Create a link for a resource the caller may share (`resolveShareable`).
	 * `ownerId` is the link's creator: whose "My links" it lists in.
	 */
	async create(
		input: CreateShareInput,
	): Promise<Share | "not-found" | "forbidden"> {
		const row = await this.resolveShareable(
			input.ownerId,
			input.resourceType,
			input.resourceId,
		);
		if (typeof row === "string") {
			logger.warn(
				`Refusing share: ${input.resourceType} ${input.resourceId} ${row} for ${input.ownerId}`,
			);
			return row;
		}
		const resourceName = row.name;

		const expiresAt =
			input.expiresInDays && input.expiresInDays > 0
				? new Date(Date.now() + input.expiresInDays * 86_400_000)
				: null;

		const [share] = await this.db
			.insert(shares)
			.values({
				id: crypto.randomUUID(),
				token: generateToken(),
				ownerId: input.ownerId,
				resourceType: input.resourceType,
				resourceId: input.resourceId,
				resourceName,
				passwordHash: input.password
					? await Bun.password.hash(input.password)
					: null,
				requiresAuth: input.requiresAuth ?? false,
				expiresAt,
			})
			.returning();

		if (!share) {
			throw new Error("Share insert returned no row");
		}
		return share;
	}

	/**
	 * The resource's row if `userId` may link to it: they own the row, or it
	 * sits on a shared drive they manage. Checked again every time the link is
	 * opened, so a manager's links die with their role.
	 */
	async resolveShareable(
		userId: string,
		resourceType: "file" | "folder",
		resourceId: string,
	): Promise<ShareableRow | "not-found" | "forbidden"> {
		const table = resourceType === "folder" ? folders : files;
		const [row] = await this.db
			.select({
				name: table.name,
				ownerId: table.ownerId,
				volumeId: table.volumeId,
			})
			.from(table)
			.where(eq(table.id, resourceId));
		if (!row) {
			return "not-found";
		}
		if (row.ownerId === userId) {
			return row;
		}
		const driveId = row.volumeId?.startsWith("drive:")
			? row.volumeId.slice("drive:".length)
			: null;
		if (!driveId) {
			return "forbidden";
		}
		const [manager] = await this.db
			.select({ id: drives.id })
			.from(drives)
			.leftJoin(
				driveMembers,
				and(
					eq(driveMembers.driveId, drives.id),
					eq(driveMembers.userId, userId),
				),
			)
			.where(
				and(
					eq(drives.id, driveId),
					or(eq(drives.ownerId, userId), eq(driveMembers.role, "manager")),
				),
			);
		return manager ? row : "forbidden";
	}

	/** Every link owned by a user, newest first. */
	list(ownerId: string): Promise<Share[]> {
		return this.db
			.select()
			.from(shares)
			.where(eq(shares.ownerId, ownerId))
			.orderBy(desc(shares.createdAt));
	}

	/** Delete a link. Scoped to the owner so an id alone is not enough. */
	async revoke(ownerId: string, shareId: string): Promise<boolean> {
		const deleted = await this.db
			.delete(shares)
			.where(and(eq(shares.id, shareId), eq(shares.ownerId, ownerId)))
			.returning({ id: shares.id });
		return deleted.length > 0;
	}

	/** The raw row for a token, without any access checks. */
	async findByToken(token: string): Promise<Share | null> {
		const [share] = await this.db
			.select()
			.from(shares)
			.where(eq(shares.token, token));
		return share ?? null;
	}

	/**
	 * Resolve a token into a usable share, applying every gate: existence,
	 * expiry, sign-in requirement, then password. Callers get a reason rather
	 * than a boolean so the page can ask for a password instead of 404ing.
	 */
	async access(
		token: string,
		opts: {
			viewer?: User | null;
			password?: string | null;
			/** Proof from a previous successful unlock (see `unlockToken`). */
			unlock?: string | null;
		} = {},
	): Promise<ShareAccess> {
		const share = await this.findByToken(token);
		if (!share) {
			return { ok: false, reason: "not-found" };
		}

		if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
			return { ok: false, reason: "expired" };
		}

		if (share.requiresAuth && !opts.viewer) {
			return { ok: false, reason: "auth" };
		}

		if (!(await this.passwordSatisfied(share, opts))) {
			return { ok: false, reason: "password" };
		}

		return { ok: true, share };
	}

	/**
	 * True when the visitor may see past a password gate: the share has no
	 * password, they own it, they already unlocked it, or they just typed the
	 * right one.
	 */
	private async passwordSatisfied(
		share: Share,
		opts: {
			viewer?: User | null;
			password?: string | null;
			unlock?: string | null;
		},
	): Promise<boolean> {
		if (!share.passwordHash) {
			return true;
		}
		// The owner opening their own link should not have to type it.
		if (opts.viewer?.id === share.ownerId) {
			return true;
		}
		if (opts.unlock && opts.unlock === (await unlockToken(share))) {
			return true;
		}
		if (!opts.password) {
			return false;
		}
		return Bun.password.verify(opts.password, share.passwordHash);
	}

	/**
	 * Whether `fileId` lives inside `folderId`, at any depth.
	 *
	 * A folder share must not become a read-anything capability: the download
	 * endpoint takes a file id from the query string, so it has to prove that
	 * file is actually under the shared folder before serving it. Storage keys
	 * are hierarchical ("parent/child/file.txt"), so the prefix answers it in
	 * one query — with the trailing slash, so "folder-1" does not match
	 * "folder-10/secret.txt".
	 */
	async fileIsInFolder(folderId: string, fileId: string): Promise<boolean> {
		const [folder] = await this.db
			.select({
				path: folders.path,
				volumeId: folders.volumeId,
				ownerId: folders.ownerId,
			})
			.from(folders)
			.where(eq(folders.id, folderId));
		if (!folder) {
			return false;
		}

		const [file] = await this.db
			.select({
				path: files.path,
				volumeId: files.volumeId,
				ownerId: files.ownerId,
			})
			.from(files)
			.where(and(eq(files.id, fileId), eq(files.isTrashed, false)));
		if (!file) {
			return false;
		}

		return (
			file.ownerId === folder.ownerId &&
			file.volumeId === folder.volumeId &&
			file.path.startsWith(`${folder.path}/`)
		);
	}

	async recordDownload(shareId: string): Promise<void> {
		await this.db
			.update(shares)
			.set({ downloadCount: sql`${shares.downloadCount} + 1` })
			.where(eq(shares.id, shareId));
	}

	/** Drop links whose expiry has passed. Called from the admin cleanup path. */
	async purgeExpired(): Promise<number> {
		const deleted = await this.db
			.delete(shares)
			// Typed operators, not raw SQL: `expiresAt` is a timestamp on
			// Postgres and an integer on SQLite, and only the column mapper
			// knows how to bind a Date for each.
			.where(
				and(isNotNull(shares.expiresAt), lte(shares.expiresAt, new Date())),
			)
			.returning({ id: shares.id });
		return deleted.length;
	}
}

/**
 * Proof that a visitor already typed the right password for a share.
 *
 * Derived from the auth secret and the share's own hash, so it is worthless
 * for any other share, dies when the password changes, and never puts the
 * plaintext password in a cookie.
 */
export async function unlockToken(share: Share): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(getConfig().auth.secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const mac = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(`${share.id}:${share.passwordHash ?? ""}`),
	);
	return Array.from(new Uint8Array(mac), (b) =>
		b.toString(16).padStart(2, "0"),
	).join("");
}

/** Cookie name carrying the unlock proof for one share. */
export function unlockCookieName(token: string): string {
	return `share_unlock_${token}`;
}
