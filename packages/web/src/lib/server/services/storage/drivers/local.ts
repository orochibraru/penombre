import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Logger } from "$lib/logger";
import type { StorageDriver } from "../driver";

const logger = new Logger("LocalStorageDriver");

export class LocalStorageDriver implements StorageDriver {
	constructor(private readonly storagePath: string) {}

	private fullPath(key: string): string {
		return join(this.storagePath, key);
	}

	async readObject(key: string): Promise<ArrayBuffer> {
		return Bun.file(this.fullPath(key)).arrayBuffer();
	}

	async getObjectStream(
		key: string,
		rangeStart?: number,
		rangeEnd?: number,
	): Promise<ReadableStream<Uint8Array>> {
		const file = Bun.file(this.fullPath(key));
		if (rangeStart !== undefined) {
			const end = rangeEnd !== undefined ? rangeEnd + 1 : undefined;
			return file.slice(rangeStart, end).stream() as ReadableStream<Uint8Array>;
		}
		return file.stream() as ReadableStream<Uint8Array>;
	}

	async getObjectSize(key: string): Promise<number> {
		return Bun.file(this.fullPath(key)).size;
	}

	async writeObject(
		key: string,
		data: ArrayBuffer | Uint8Array | Blob,
	): Promise<void> {
		const path = this.fullPath(key);
		await mkdir(dirname(path), { recursive: true });
		await Bun.write(path, data);
	}

	async deleteObject(key: string): Promise<void> {
		await Bun.file(this.fullPath(key)).delete();
	}

	async deleteObjectsByPrefix(prefix: string): Promise<void> {
		const normalized = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
		// Empty prefix → clear all contents of the user root without removing the root dir itself
		const targetPath = normalized
			? this.fullPath(normalized)
			: this.storagePath;

		if (!existsSync(targetPath)) return;

		const targetStat = await fs.promises.stat(targetPath);

		if (targetStat.isDirectory()) {
			if (normalized) {
				await rm(targetPath, { recursive: true, force: true });
			} else {
				// Delete contents only so the root folder is preserved
				const entries = await readdir(targetPath, { withFileTypes: true });
				await Promise.all(
					entries.map(async (entry) => {
						const entryPath = join(targetPath, entry.name);
						if (entry.isDirectory()) {
							await rm(entryPath, { recursive: true, force: true });
						} else {
							await unlink(entryPath).catch(() => {});
						}
					}),
				);
			}
			return;
		}

		await unlink(targetPath).catch(() => {});
	}

	async copyObject(src: string, dest: string): Promise<void> {
		const destPath = this.fullPath(dest);
		await mkdir(dirname(destPath), { recursive: true });
		const content = await Bun.file(this.fullPath(src)).arrayBuffer();
		await Bun.write(destPath, content);
	}

	async objectExists(key: string): Promise<boolean> {
		return Bun.file(this.fullPath(key)).exists();
	}

	async listObjectKeys(prefix?: string): Promise<string[]> {
		const basePath = prefix ? this.fullPath(prefix) : this.storagePath;
		if (!existsSync(basePath)) return [];
		return this.walkKeys(basePath, this.storagePath);
	}

	private async walkKeys(dirPath: string, root: string): Promise<string[]> {
		const results: string[] = [];
		const entries = await readdir(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);
			if (entry.isDirectory()) {
				const nested = await this.walkKeys(fullPath, root);
				results.push(...nested);
			} else {
				// Strip root prefix (+ trailing slash) to produce a relative key
				results.push(fullPath.slice(root.length + 1));
			}
		}
		return results;
	}

	async ensureRootExists(): Promise<void> {
		if (!existsSync(this.storagePath)) {
			logger.info(
				`Creating user storage folder at path: ${this.storagePath}...`,
			);
			await mkdir(this.storagePath, { recursive: true });
		}
	}

	getAvailableDiskSpace(): number {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: statfsSync types are complex
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

		return 0;
	}
}
