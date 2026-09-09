/**
 * DB dialect resolution — kept free of `$env`/SvelteKit imports on purpose.
 * `drizzle.config.ts`/`drizzle.sqlite.config.ts` (drizzle-kit CLI) import
 * this outside the SvelteKit runtime, where `$lib/server/config` can't
 * resolve. Mirrors the existing local `Bun.env` read pattern in this folder.
 */

export type DbDialect = "pg" | "sqlite";

const DEFAULT_URL =
	"postgres://postgres:postgres@localhost:5432/penombre?sslmode=disable";

/** `file:`/`sqlite:` scheme → SQLite (rest of the value is a file path). Anything else → Postgres. */
export function resolveDbDialect(url: string): DbDialect {
	return /^(file:|sqlite:)/i.test(url) ? "sqlite" : "pg";
}

export function getDbUrl(): string {
	return Bun.env.DATABASE_URL ?? DEFAULT_URL;
}

/**
 * Strip the `file:`/`sqlite:` scheme, leaving a plain filesystem path for
 * `bun:sqlite`. Only a `//` authority prefix is dropped, so an absolute
 * path keeps its leading slash: `file:/data/db.sqlite` and
 * `file:///data/db.sqlite` both resolve to `/data/db.sqlite`, while
 * `sqlite://./db.sqlite` stays relative.
 */
export function getSqliteFilePath(url: string): string {
	return url.replace(/^(file:|sqlite:)/i, "").replace(/^\/\//, "");
}

export function isSqliteDialect(): boolean {
	return resolveDbDialect(getDbUrl()) === "sqlite";
}
