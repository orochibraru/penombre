import { describe, expect, test } from "bun:test";

import {
	dataPaths,
	defaultConfigValues,
	defaultDbUrl,
	DEV_DATA_DIR,
	generateExampleDotenvFile,
} from "./config.defaults";

describe("data directory layout", () => {
	test("storage and db hang off the data directory", () => {
		expect(dataPaths("/data")).toEqual({
			storagePath: "/data/storage",
			dbLocation: "/data/db",
		});
		expect(dataPaths(DEV_DATA_DIR)).toEqual({
			storagePath: "./data/storage",
			dbLocation: "./data/db",
		});
	});

	test("the sqlite file lives in the db directory", () => {
		expect(defaultDbUrl("/data")).toBe("file:/data/db/penombre.sqlite");
		expect(defaultDbUrl(DEV_DATA_DIR)).toBe("file:./data/db/penombre.sqlite");
	});

	test("defaults match the production data directory", () => {
		expect(defaultConfigValues.dataDir).toBe("/data");
		expect(defaultConfigValues.storagePath).toBe("/data/storage");
		expect(defaultConfigValues.dbLocation).toBe("/data/db");
		expect(defaultConfigValues.db.url).toBe("file:/data/db/penombre.sqlite");
	});
});

describe("generateExampleDotenvFile", () => {
	const file = generateExampleDotenvFile();

	test("every variable it sets carries the runtime default", () => {
		const lines = file.split("\n");
		for (const line of [
			"APP_NAME=Penombre",
			"APP_ENV=production",
			"LOG_LEVEL=info",
			"LOG_FORMAT=console",
			"ORIGIN=http://localhost:3000",
			"ENABLE_EMAIL_SIGNIN=true",
			"ENABLE_OAUTH_SIGNIN=false",
			"MIN_PASSWORD_LENGTH=8",
			`AUTH_SECRET=${defaultConfigValues.auth.secret}`,
			"WORKER_MODE=embedded",
			"WORKER_CONCURRENCY=4",
			"SIMPLE_MODE=false",
			"BYPASS_AUTH=false",
			"SMTP_ENABLED=false",
			"SMTP_PORT=587",
			"SMTP_SECURE=false",
			"ENABLE_VERSION_CHECK=true",
		]) {
			expect(lines).toContain(line);
		}
	});

	test("paths and the database URL are documented, not set", () => {
		expect(file).toContain(`# DATABASE_URL=${defaultConfigValues.db.url}`);
		expect(file).toContain("# DATA_DIR=/data");
		expect(file).toContain("# STORAGE_PATH=/data/storage");
		expect(file).toMatch(/^# ENCRYPTION_KEY=$/m);
	});

	// The first admin comes from the setup screen, never a published password.
	test("declares no admin credentials", () => {
		expect(file).not.toMatch(/^ADMIN_(EMAIL|PASSWORD)=/m);
	});

	test("the core section comes before the runtime one", () => {
		expect(file.startsWith("# ===")).toBe(true);
		expect(file.indexOf("OAUTH_DEFAULT_SCOPES")).toBeLessThan(
			file.indexOf("WORKER_MODE="),
		);
	});
});
