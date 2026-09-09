import { join, resolve } from "node:path";
import { Logger } from "$lib/logger";
import type { StorageDriver } from "./driver";
import { LocalStorageDriver } from "./drivers/local";

export const logger = new Logger("StorageService");

/**
 * `resolve` already anchors relative paths to the cwd and leaves absolute
 * ones alone — joining the cwd on top of it turned the documented
 * `STORAGE_PATH=/data/storage` into `/app/data/storage` inside the container,
 * so a mounted volume was never actually read or written.
 */
export const DEFAULT_STORAGE_PATH = resolve(
	Bun.env.STORAGE_PATH || "/data/storage",
);

/**
 * Create a `StorageDriver` for a specific user. Call once per request /
 * service construction.
 */
export function createUserStorageDriver(userFolder: string): StorageDriver {
	return new LocalStorageDriver(join(DEFAULT_STORAGE_PATH, userFolder));
}
