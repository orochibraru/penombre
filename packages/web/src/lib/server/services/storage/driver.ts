import { LocalStorageDriver } from "./drivers/local";
import { S3StorageDriver } from "./drivers/s3";

/**
 * Unified interface for all storage backends (local filesystem, S3-compatible).
 * All `key` arguments are relative to the user's storage root.
 */
export interface StorageDriver {
	/** Read the full content of an object into memory. */
	readObject(key: string): Promise<ArrayBuffer>;

	/**
	 * Open an object as a readable stream, optionally with a byte range.
	 * Both `rangeStart` and `rangeEnd` are inclusive byte offsets.
	 */
	getObjectStream(
		key: string,
		rangeStart?: number,
		rangeEnd?: number,
	): Promise<ReadableStream<Uint8Array>>;

	/** Return the size of an object in bytes. */
	getObjectSize(key: string): Promise<number>;

	/** Write data to an object, creating or replacing it. */
	writeObject(
		key: string,
		data: ArrayBuffer | Uint8Array | Blob,
	): Promise<void>;

	/** Delete a single object. */
	deleteObject(key: string): Promise<void>;

	/**
	 * Delete all objects whose keys start with `prefix`.
	 * A trailing slash is recommended for directory-like prefixes.
	 */
	deleteObjectsByPrefix(prefix: string): Promise<void>;

	/** Copy an object from `src` to `dest` (both relative to the user root). */
	copyObject(src: string, dest: string): Promise<void>;

	/** Return true if the object exists. */
	objectExists(key: string): Promise<boolean>;

	/**
	 * List all object keys, optionally filtered by a key prefix.
	 * Returns paths relative to the user's storage root.
	 */
	listObjectKeys(prefix?: string): Promise<string[]>;

	/**
	 * Ensure the storage root exists (create directories for local, no-op for S3).
	 */
	ensureRootExists(): Promise<void>;

	/**
	 * Return available disk space in bytes for the underlying storage volume.
	 * Returns `undefined` for backends where this is not applicable (e.g. S3).
	 */
	getAvailableDiskSpace?(): number;
}

// =========================================================================
// Driver configuration types
// =========================================================================

export type S3DriverConfig = {
	/** Optional endpoint URL for S3-compatible services (MinIO, R2, Backblaze B2, etc.) */
	endpoint?: string;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	/** Use path-style addressing; required for MinIO and some other providers. */
	pathStyle?: boolean;
	/** Prefix prepended to all keys, e.g. "user-{userId}". */
	userPrefix: string;
};

export type LocalDriverConfig = {
	/** Absolute path to the user's storage folder on disk. */
	storagePath: string;
};

export type StorageDriverOptions =
	| { backend: "local"; local: LocalDriverConfig }
	| { backend: "s3"; s3: S3DriverConfig };

// =========================================================================
// Factory
// =========================================================================

export function createStorageDriver(
	options: StorageDriverOptions,
): StorageDriver {
	if (options.backend === "s3") {
		return new S3StorageDriver(options.s3);
	}
	return new LocalStorageDriver(options.local.storagePath);
}
