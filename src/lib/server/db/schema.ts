/**
 * Dialect-resolving schema shim. The real schemas live in `schema.pg.ts`
 * (Postgres) and `schema.sqlite.ts` (SQLite) — this module picks the active
 * dialect's table objects and re-exports them under one Postgres-shaped
 * type, so the rest of the app compiles against a single schema regardless
 * of which DB is actually running.
 *
 * `db/index.ts` builds the matching client for the same dialect, so at
 * runtime each table object here is always paired with a client of the same
 * dialect — never a mismatched pg-table-on-sqlite-client (or vice versa).
 *
 * ponytail: this means a Postgres-only construct added to `schema.pg.ts`
 * later (another `jsonb`, `.array()`, etc.) won't be caught by the type
 * checker for SQLite — only a `schema.sqlite.ts` mismatch or a runtime
 * error would surface it. Keep the two files structurally in sync by hand.
 */

import { isSqliteDialect } from "./dialect";
import * as pg from "./schema.pg";
import * as sqlite from "./schema.sqlite";

const sqliteActive = isSqliteDialect();

export const user = (sqliteActive ? sqlite.user : pg.user) as typeof pg.user;
export const session = (
	sqliteActive ? sqlite.session : pg.session
) as typeof pg.session;
export const account = (
	sqliteActive ? sqlite.account : pg.account
) as typeof pg.account;
export const verification = (
	sqliteActive ? sqlite.verification : pg.verification
) as typeof pg.verification;
export const activity = (
	sqliteActive ? sqlite.activity : pg.activity
) as typeof pg.activity;
export const sharings = (
	sqliteActive ? sqlite.sharings : pg.sharings
) as typeof pg.sharings;
export const sharedWith = (
	sqliteActive ? sqlite.sharedWith : pg.sharedWith
) as typeof pg.sharedWith;
export const shares = (
	sqliteActive ? sqlite.shares : pg.shares
) as typeof pg.shares;
export const appSettings = (
	sqliteActive ? sqlite.appSettings : pg.appSettings
) as typeof pg.appSettings;
export const userPreferences = (
	sqliteActive ? sqlite.userPreferences : pg.userPreferences
) as typeof pg.userPreferences;
export const apikey = (
	sqliteActive ? sqlite.apikey : pg.apikey
) as typeof pg.apikey;
export const passkey = (
	sqliteActive ? sqlite.passkey : pg.passkey
) as typeof pg.passkey;
export const twoFactor = (
	sqliteActive ? sqlite.twoFactor : pg.twoFactor
) as typeof pg.twoFactor;
export const folders = (
	sqliteActive ? sqlite.folders : pg.folders
) as typeof pg.folders;
export const files = (
	sqliteActive ? sqlite.files : pg.files
) as typeof pg.files;

export type { AppSettingsData, UserPreferencesData } from "./schema.pg";
export type User = typeof pg.user.$inferSelect;
export type Session = typeof pg.session.$inferSelect;
export interface UserWithSession {
	user: User;
	session: Session;
}
export type Account = typeof pg.account.$inferSelect;
export type Verification = typeof pg.verification.$inferSelect;
export type Activity = typeof pg.activity.$inferSelect;
export type Sharing = typeof pg.sharings.$inferSelect;
export type SharedWith = typeof pg.sharedWith.$inferSelect;
export type Share = typeof pg.shares.$inferSelect;
export type AppSettings = typeof pg.appSettings.$inferSelect;
export type UserPreferences = typeof pg.userPreferences.$inferSelect;
export type Apikey = typeof pg.apikey.$inferSelect;
export type Passkey = typeof pg.passkey.$inferSelect;
export type TwoFactor = typeof pg.twoFactor.$inferSelect;
export type Folder = typeof pg.folders.$inferSelect;
export type File = typeof pg.files.$inferSelect;
