import { join, resolve } from "node:path";
import { Logger } from "$lib/logger";
import { getConfig } from "$lib/server/config";
import type { StorageDriver } from "./driver";
import { createStorageDriver } from "./driver";

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
 * Create a `StorageDriver` for a specific user, using the active storage backend
 * from the application config. Call once per request / service construction.
 */
export function createUserStorageDriver(userFolder: string): StorageDriver {
	const config = getConfig();

	if (config.storage.backend === "s3") {
		if (!config.s3) {
			throw new Error(
				"S3 storage backend is selected but S3 configuration is missing.",
			);
		}
		return createStorageDriver({
			backend: "s3",
			s3: {
				endpoint: config.s3.endpoint,
				region: config.s3.region,
				bucket: config.s3.bucket,
				accessKeyId: config.s3.accessKeyId,
				secretAccessKey: config.s3.secretAccessKey,
				pathStyle: config.s3.pathStyle,
				userPrefix: userFolder,
			},
		});
	}

	return createStorageDriver({
		backend: "local",
		local: {
			storagePath: join(DEFAULT_STORAGE_PATH, userFolder),
		},
	});
}
