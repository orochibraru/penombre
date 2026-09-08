// biome-ignore-all lint/suspicious/useAwait: methods implement the async StorageDriver contract; `async` keeps the Promise return type without wrapping every result.
import * as fs from "node:fs";
import { existsSync } from "node:fs";
import { mkdir, readdir, rm, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Logger } from "$lib/logger";
import { availableDiskSpace } from "../disk-space";
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

		if (!existsSync(targetPath)) {
			return;
		}

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
							await unlink(entryPath).catch(() => {
								// best-effort: the entry may already be gone
							});
						}
					}),
				);
			}
			return;
		}

		await unlink(targetPath).catch(() => {
			// best-effort: the object may already be gone
		});
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
		if (!existsSync(basePath)) {
			return [];
		}
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
		return availableDiskSpace(this.storagePath);
	}
}
