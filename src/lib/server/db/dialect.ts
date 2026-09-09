/**
 * DB dialect resolution — kept free of `$env`/SvelteKit imports on purpose.
 * `drizzle.config.ts`/`drizzle.sqlite.config.ts` (drizzle-kit CLI) import
 * this outside the SvelteKit runtime, where `$lib/server/config` can't
 * resolve. Mirrors the existing local `Bun.env` read pattern in this folder.
 */

export type DbDialect = "pg" | "sqlite";

/** SQLite is the default: no database server to run for a homelab install. */
const DEFAULT_URL = "file:./data/penombre.sqlite";

/**
 * Postgres is opt-in and only via an explicit `postgres:`/`postgresql:` scheme.
 * Everything else — `file:`/`sqlite:`, but also an empty or malformed value —
 * resolves to SQLite, so a bad `DATABASE_URL` can never silently turn a
 * single-container install into a Postgres client dialing a server that isn't
 * there.
 */
export function resolveDbDialect(url: string): DbDialect {
	return /^postgres(ql)?:/i.test(url) ? "pg" : "sqlite";
}

/** Trimmed and `||`: an empty or whitespace `DATABASE_URL` (an unset var rendered by a deploy UI or compose) means "not set". */
export function getDbUrl(): string {
	return Bun.env.DATABASE_URL?.trim() || DEFAULT_URL;
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
