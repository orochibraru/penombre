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
