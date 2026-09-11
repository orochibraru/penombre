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
