import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { readdir, rmdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { getDb } from "$lib/server/db";
import { user } from "$lib/server/db/schema";
import { DEFAULT_STORAGE_PATH, logger } from "./constants";

export class AdminStorageService {
	private storagePath: string;

	constructor() {
		this.storagePath = resolve(DEFAULT_STORAGE_PATH);
	}

	public getStoragePath(): string {
		return this.storagePath;
	}

	public getAvailableStorageSize(): number {
		// The previous implementation used file stats (blksize * blocks) which
		// describes the inode, not filesystem free space. That's wrong.
		// Try statfs first (Node >=19/20); fallback to parsing `df -k`.
		try {
			// biome-ignore lint/suspicious/noExplicitAny: Avoiding complex types for this
			const anyFs = fs as unknown as { statfsSync?: (path: string) => any };
			if (typeof anyFs.statfsSync === "function") {
				const sfs = anyFs.statfsSync(this.storagePath);
				const blockSize = Number(sfs?.bsize ?? sfs?.frsize ?? 4096);
				const availBlocks = Number(sfs?.bavail ?? sfs?.bfree ?? 0);
				if (Number.isFinite(blockSize) && Number.isFinite(availBlocks)) {
					return blockSize * availBlocks;
				}
			}
		} catch (err) {
			logger.warn("statfsSync unavailable or failed:", err);
		}

		// Fallback: use `df -k` to get Available (in KiB) and convert to bytes
		try {
			const proc = Bun.spawnSync(["df", "-k", this.storagePath]);
			const output = new TextDecoder().decode(proc.stdout || new Uint8Array());
			const lines = output.trim().split("\n");
			if (lines.length >= 2) {
				if (!lines[0] || !lines[1]) {
					throw new Error("df output parsing error");
				}
				const headers = lines[0].trim().split(/\s+/);
				const values = lines[1].trim().split(/\s+/);
				let availIdx = headers.findIndex((h) => /avail|available/i.test(h));
				if (availIdx === -1) {
					// BSD/macOS often uses "1024-blocks Used Available Capacity Mounted on"
					// If header parsing fails, assume the second-to-last numeric before mountpoint
					const mountedIdx = headers.findIndex((h) => /mounted/i.test(h));
					if (mountedIdx > 0) {
						availIdx = mountedIdx - 2;
					} else if (values.length >= 4) {
						availIdx = values.length - 2;
					}
				}
				const availStr = values[availIdx];
				const availKiB = availStr ? Number.parseInt(availStr, 10) : Number.NaN;
				if (Number.isFinite(availKiB)) {
					return availKiB * 1024;
				}
			}
			logger.warn("Failed to parse df output:", output);
		} catch (err) {
			logger.warn("df command failed:", err);
		}

		// Last resort: unknown free space
		return 0;
	}

	/**
	 * Cleanup storage directories for users that no longer exist in the database.
	 * This is useful for maintaining storage hygiene after user deletions.
	 */
	async cleanupDeletedUserStorage(): Promise<void> {
		const db = getDb();
		const usersList = await db.select().from(user);
		if (usersList.length === 0) {
			logger.info("No users found in database. Skipping storage cleanup.");
			return;
		}

		const storageBasePath = resolve(
			Bun.env.STORAGE_PATH || join(cwd(), "/data/storage"),
		);
		const exists = existsSync(storageBasePath);
		if (!exists) {
			logger.info(
				"Storage base path does not exist. Skipping storage cleanup.",
			);
			return;
		}
		const storageDir = await readdir(storageBasePath, { withFileTypes: true });

		for (const dirent of storageDir) {
			if (dirent.isDirectory() && dirent.name.startsWith("user-")) {
				const userId = dirent.name.replace("user-", "");
				const userExists = usersList.some((u) => u.id === userId);
				if (!userExists) {
					const userStoragePath = join(storageBasePath, dirent.name);
					try {
						await rmdir(userStoragePath, { recursive: true });
						logger.info(
							`Deleted storage for non-existent user ID: ${userId} at path: ${userStoragePath}`,
						);
					} catch (error) {
						logger.error(
							`Failed to delete storage for user ID: ${userId} at path: ${userStoragePath}`,
							error,
						);
					}
				}
			}
		}
	}
}
