import { join } from "node:path";
import { getStoragePath } from "$lib/server/config";
import { LocalStorageDriver } from "./drivers/local";

/**
 * The storage backend's contract. Only `LocalStorageDriver` implements it;
 * it stays an interface because every consumer (and every test double) types
 * against it rather than the class.
 * All `key` arguments are relative to the user's storage root.
 */
export interface StorageDriver {
	/** Read the full content of an object into memory. */
	readObject: (key: string) => Promise<ArrayBuffer>;

	/**
	 * Open an object as a readable stream, optionally with a byte range.
	 * Both `rangeStart` and `rangeEnd` are inclusive byte offsets.
	 */
	getObjectStream: (
		key: string,
		rangeStart?: number,
		rangeEnd?: number,
	) => Promise<ReadableStream<Uint8Array>>;

	/** Return the size of an object in bytes. */
	getObjectSize: (key: string) => Promise<number>;

	/** Write data to an object, creating or replacing it. */
	writeObject: (
		key: string,
		data: ArrayBuffer | Uint8Array | Blob,
	) => Promise<void>;

	/** Delete a single object. */
	deleteObject: (key: string) => Promise<void>;

	/**
	 * Delete all objects whose keys start with `prefix`.
	 * A trailing slash is recommended for directory-like prefixes.
	 */
	deleteObjectsByPrefix: (prefix: string) => Promise<void>;

	/** Copy an object from `src` to `dest` (both relative to the user root). */
	copyObject: (src: string, dest: string) => Promise<void>;

	/** Return true if the object exists. */
	objectExists: (key: string) => Promise<boolean>;

	/**
	 * List all object keys, optionally filtered by a key prefix.
	 * Returns paths relative to the user's storage root.
	 */
	listObjectKeys: (prefix?: string) => Promise<string[]>;

	/** Ensure the storage root directory exists. */
	ensureRootExists: () => Promise<void>;

	/** Available disk space in bytes on the underlying storage volume. */
	getAvailableDiskSpace: () => number;
}

/**
 * Create a `StorageDriver` for a specific user, rooted at the user's folder
 * under `config.storagePath`. Call once per request / service construction.
 */
export function createUserStorageDriver(userFolder: string): StorageDriver {
	return new LocalStorageDriver(join(getStoragePath(), userFolder));
}

/**
 * Create a driver rooted at a mounted volume.
 *
 * In full mode each user gets a subdirectory of the volume, mirroring how the
 * main drive is laid out; in simple mode the volume is shared whole, so the
 * root is the mount point itself.
 */
export function createVolumeStorageDriver(
	volumePath: string,
	userFolder: string,
): StorageDriver {
	return new LocalStorageDriver(join(volumePath, userFolder));
}
