import { describe, expect, test } from "bun:test";

import {
	DriveAccessError,
	FileOrFolderNotFoundError,
	isStorageUnavailable,
	isUniqueViolation,
	ReadOnlyVolumeError,
	rethrowUnreachable,
	StorageUnavailableError,
	UnauthorizedError,
	VersioningDisabledError,
	VersionMergeError,
} from "./errors";

function errno(code: string): NodeJS.ErrnoException {
	return Object.assign(new Error(code), { code });
}

describe("error types", () => {
	test("each carries its own name and message", () => {
		const errors = [
			new FileOrFolderNotFoundError("no such file"),
			new UnauthorizedError("not yours"),
			new VersionMergeError("one file only"),
		];
		expect(errors.map((error) => [error.name, error.message])).toEqual([
			["FileOrFolderNotFoundError", "no such file"],
			["UnauthorizedError", "not yours"],
			["VersionMergeError", "one file only"],
		]);
		for (const error of errors) {
			expect(error).toBeInstanceOf(Error);
		}
	});

	test("refusals default to a message the caller can read", () => {
		expect(new ReadOnlyVolumeError().message).toBe("This volume is read-only");
		expect(new ReadOnlyVolumeError("view only").message).toBe("view only");
		expect(new VersioningDisabledError().message).toBe(
			"File versioning is turned off",
		);
		expect(new VersioningDisabledError().name).toBe("VersioningDisabledError");
	});

	test("a drive refusal keeps the status it answers with", () => {
		const error = new DriveAccessError(404, "No such drive");
		expect(error.status).toBe(404);
		expect(error.name).toBe("DriveAccessError");
		expect(error.message).toBe("No such drive");
	});
});

describe("rethrowUnreachable", () => {
	test("a permission failure becomes StorageUnavailableError on that path", () => {
		for (const code of ["EACCES", "EPERM", "EROFS", "ENOTDIR"]) {
			const cause = errno(code);
			let thrown: unknown;
			try {
				rethrowUnreachable(cause, "/mnt/media");
			} catch (error) {
				thrown = error;
			}
			expect(thrown).toBeInstanceOf(StorageUnavailableError);
			const unavailable = thrown as StorageUnavailableError;
			expect(unavailable.path).toBe("/mnt/media");
			expect(unavailable.cause).toBe(cause);
			expect(unavailable.message).toBe(
				"Storage at /mnt/media is not accessible",
			);
			expect(isStorageUnavailable(unavailable)).toBe(true);
		}
	});

	test("a missing file and anything without a code are rethrown unchanged", () => {
		const missing = errno("ENOENT");
		expect(() => rethrowUnreachable(missing, "/mnt/media")).toThrow(missing);
		const plain = new Error("boom");
		expect(() => rethrowUnreachable(plain, "/mnt/media")).toThrow(plain);
		expect(() => rethrowUnreachable(null, "/mnt/media")).toThrow();
	});
});

describe("isStorageUnavailable", () => {
	test("only matches the storage error itself", () => {
		expect(isStorageUnavailable(new StorageUnavailableError("/x"))).toBe(true);
		expect(isStorageUnavailable(errno("EACCES"))).toBe(false);
		expect(isStorageUnavailable(undefined)).toBe(false);
	});
});

describe("isUniqueViolation", () => {
	test("finds Postgres's code deep in the cause chain", () => {
		const driver = Object.assign(new Error("duplicate key"), { code: "23505" });
		const wrapped = new Error("Failed query", {
			cause: new Error("inner", { cause: driver }),
		});
		expect(isUniqueViolation(wrapped)).toBe(true);
	});

	test("an error that is its own cause ends the walk", () => {
		const looping = new Error("loop") as Error & { cause?: unknown };
		looping.cause = looping;
		expect(isUniqueViolation(looping)).toBe(false);
	});
});
