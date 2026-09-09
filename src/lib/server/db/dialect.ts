/**
 * DB dialect resolution — kept free of `$env`/SvelteKit imports on purpose.
 * `drizzle.config.ts`/`drizzle.sqlite.config.ts` (drizzle-kit CLI) import
 * this outside the SvelteKit runtime, where `$lib/server/config` can't
 * resolve. Mirrors the existing local `Bun.env` read pattern in this folder.
 */

export type DbDialect = "pg" | "sqlite";

/** SQLite is the default: no database server to run for a homelab install. */
const DEFAULT_URL = "file:./data/penombre.sqlite";

/** `file:`/`sqlite:` scheme → SQLite (rest of the value is a file path). Anything else → Postgres (optional). */
export function resolveDbDialect(url: string): DbDialect {
	return /^(file:|sqlite:)/i.test(url) ? "sqlite" : "pg";
}

/** `||` on purpose: an empty `DATABASE_URL` (unset var rendered by a deploy UI/compose) must fall back to SQLite, not be read as a Postgres URL. */
export function getDbUrl(): string {
	return Bun.env.DATABASE_URL || DEFAULT_URL;
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
