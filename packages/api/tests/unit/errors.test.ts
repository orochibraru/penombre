import { describe, expect, test } from "bun:test";
import { FileNotFoundError, UnauthorizedError } from "@lib/errors";

describe("FileNotFoundError", () => {
	test("creates error with correct name", () => {
		const error = new FileNotFoundError("File not found");

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(FileNotFoundError);
		expect(error.name).toBe("FileNotFoundError");
		expect(error.message).toBe("File not found");
	});

	test("preserves stack trace", () => {
		const error = new FileNotFoundError("Test error");

		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("FileNotFoundError");
	});

	test("can be caught as Error", () => {
		expect(() => {
			throw new FileNotFoundError("test");
		}).toThrow(Error);
	});

	test("can be caught specifically", () => {
		expect(() => {
			throw new FileNotFoundError("test");
		}).toThrow(FileNotFoundError);
	});

	test("distinguishable from other errors", () => {
		const fileError = new FileNotFoundError("file");
		const genericError = new Error("generic");

		expect(fileError instanceof FileNotFoundError).toBe(true);
		expect(genericError instanceof FileNotFoundError).toBe(false);
	});
});

describe("UnauthorizedError", () => {
	test("creates error with correct name", () => {
		const error = new UnauthorizedError("Unauthorized access");

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(UnauthorizedError);
		expect(error.name).toBe("UnauthorizedError");
		expect(error.message).toBe("Unauthorized access");
	});

	test("preserves stack trace", () => {
		const error = new UnauthorizedError("Test unauthorized");

		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("UnauthorizedError");
	});

	test("can be caught as Error", () => {
		expect(() => {
			throw new UnauthorizedError("test");
		}).toThrow(Error);
	});

	test("can be caught specifically", () => {
		expect(() => {
			throw new UnauthorizedError("test");
		}).toThrow(UnauthorizedError);
	});

	test("distinguishable from FileNotFoundError", () => {
		const authError = new UnauthorizedError("auth");
		const fileError = new FileNotFoundError("file");

		expect(authError instanceof UnauthorizedError).toBe(true);
		expect(authError instanceof FileNotFoundError).toBe(false);
		expect(fileError instanceof FileNotFoundError).toBe(true);
		expect(fileError instanceof UnauthorizedError).toBe(false);
	});
});

describe("Error inheritance chain", () => {
	test("both errors extend Error", () => {
		const fileError = new FileNotFoundError("file");
		const authError = new UnauthorizedError("auth");

		expect(fileError instanceof Error).toBe(true);
		expect(authError instanceof Error).toBe(true);
	});

	test("errors are properly typed for try-catch", () => {
		try {
			throw new FileNotFoundError("test file");
		} catch (error) {
			expect(error).toBeInstanceOf(FileNotFoundError);
			if (error instanceof FileNotFoundError) {
				expect(error.message).toBe("test file");
			}
		}

		try {
			throw new UnauthorizedError("test auth");
		} catch (error) {
			expect(error).toBeInstanceOf(UnauthorizedError);
			if (error instanceof UnauthorizedError) {
				expect(error.message).toBe("test auth");
			}
		}
	});
});
