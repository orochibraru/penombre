import process from "node:process";
import { defineConfig } from "drizzle-kit";
import {
	getSqliteFilePath,
	resolveDbDialect,
} from "./src/lib/server/db/dialect";

const url = process.env.DATABASE_URL ?? "file:./drizzle/sqlite-dev.db";

export default defineConfig({
	out: "./drizzle/sqlite",
	schema: "./src/lib/server/db/schema.sqlite.ts",
	dialect: "sqlite",
	dbCredentials: {
		url:
			resolveDbDialect(url) === "sqlite"
				? getSqliteFilePath(url)
				: "./drizzle/sqlite-dev.db",
	},
});
