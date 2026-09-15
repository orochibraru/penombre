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
