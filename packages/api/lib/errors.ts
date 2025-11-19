export class FileNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FileNotFoundError";
	}
}

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnauthorizedError";
	}
}
