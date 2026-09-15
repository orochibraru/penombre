export class FileOrFolderNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FileOrFolderNotFoundError";
	}
}

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnauthorizedError";
	}
}

/** Thrown when a write is attempted against a volume mounted read-only. */
export class ReadOnlyVolumeError extends Error {
	constructor(message = "This volume is read-only") {
		super(message);
		this.name = "ReadOnlyVolumeError";
	}
}

/**
 * A shared drive that does not exist, or that the caller is not a member of.
 *
 * Carries its own status because the two cases must look alike to a
 * non-member: telling them a drive exists but is closed to them is already
 * more than they should learn from a guessed id.
 */
export class DriveAccessError extends Error {
	constructor(
		readonly status: 403 | 404,
		message: string,
	) {
		super(message);
		this.name = "DriveAccessError";
	}
}

/** Filesystem failures that mean "the mount is not usable", not "no such file". */
const UNREACHABLE_CODES = new Set(["EACCES", "EPERM", "EROFS", "ENOTDIR"]);

/**
 * The bytes behind a volume cannot be reached: the directory is mounted but
 * the app has no permission on it, or it is not a directory at all.
 *
 * Its own type because it is neither the caller's fault nor a missing file —
 * a 500 tells someone to contact the admin about a problem only the admin's
 * `docker run` can fix, so it is reported as the deployment problem it is.
 */
export class StorageUnavailableError extends Error {
	constructor(
		readonly path: string,
		cause?: unknown,
	) {
		super(`Storage at ${path} is not accessible`, { cause });
		this.name = "StorageUnavailableError";
	}
}

/** Wrap a permissions failure on `path`; rethrow anything else unchanged. */
export function rethrowUnreachable(error: unknown, path: string): never {
	const code = (error as NodeJS.ErrnoException | null)?.code;
	if (code && UNREACHABLE_CODES.has(code)) {
		throw new StorageUnavailableError(path, error);
	}
	throw error;
}

export function isStorageUnavailable(error: unknown): boolean {
	return error instanceof StorageUnavailableError;
}
