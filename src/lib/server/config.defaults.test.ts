import { describe, expect, test } from "bun:test";
import {
	DEV_DATA_DIR,
	dataPaths,
	defaultConfigValues,
	defaultDbUrl,
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
