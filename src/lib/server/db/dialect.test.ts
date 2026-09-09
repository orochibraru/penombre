import { describe, expect, test } from "bun:test";
import { getSqliteFilePath, resolveDbDialect } from "./dialect";

describe("resolveDbDialect", () => {
	test("file: URLs resolve to sqlite", () => {
		expect(resolveDbDialect("file:/data/db/penombre.sqlite")).toBe("sqlite");
	});

	test("sqlite: URLs resolve to sqlite", () => {
		expect(resolveDbDialect("sqlite://./penombre.db")).toBe("sqlite");
	});

	test("postgres URLs resolve to pg", () => {
		expect(
			resolveDbDialect("postgres://user:pass@localhost:5432/penombre"),
		).toBe("pg");
		expect(
			resolveDbDialect("postgresql://user:pass@localhost:5432/penombre"),
		).toBe("pg");
	});
});

describe("getSqliteFilePath", () => {
	test("strips the file: scheme", () => {
		expect(getSqliteFilePath("file:/data/db/penombre.sqlite")).toBe(
			"/data/db/penombre.sqlite",
		);
	});

	test("strips the sqlite:// scheme", () => {
		expect(getSqliteFilePath("sqlite://./penombre.db")).toBe("./penombre.db");
	});

	test("keeps absolute paths absolute, with or without an authority", () => {
		expect(getSqliteFilePath("file:///data/db/penombre.sqlite")).toBe(
			"/data/db/penombre.sqlite",
		);
	});

	test("keeps relative paths relative", () => {
		expect(getSqliteFilePath("file:./penombre.db")).toBe("./penombre.db");
	});
});
