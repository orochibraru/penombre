import process from "node:process";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle/pg",
	schema: "./src/lib/server/db/schema.pg.ts",
	dialect: "postgresql",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ??
			"postgres://postgres:postgres@db:5432/penombre?sslmode=disable",
	},
});
