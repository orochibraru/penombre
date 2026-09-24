import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { isUniqueViolation } from "./errors";

function sqliteViolation(): unknown {
	const db = new Database(":memory:");
	db.run("create table t (k text unique)");
	db.run("insert into t values ('a')");
	try {
		db.run("insert into t values ('a')");
	} catch (error) {
		return error;
	}
	throw new Error("expected a violation");
}

describe("isUniqueViolation", () => {
	test("recognises SQLite's error, bare and wrapped the way Drizzle does", () => {
		const error = sqliteViolation();
		expect(isUniqueViolation(error)).toBe(true);
		expect(isUniqueViolation(new Error("Failed query", { cause: error }))).toBe(
			true,
		);
	});

	test("recognises Postgres's SQLSTATE 23505", () => {
		expect(
			isUniqueViolation(Object.assign(new Error("dup"), { errno: "23505" })),
		).toBe(true);
	});

	test("anything else is not one", () => {
		expect(isUniqueViolation(new Error("boom"))).toBe(false);
		expect(
			isUniqueViolation(Object.assign(new Error("fk"), { errno: "23503" })),
		).toBe(false);
		expect(isUniqueViolation(undefined)).toBe(false);
	});
});
