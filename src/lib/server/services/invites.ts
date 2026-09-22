/**
 * Single-use invite tokens that bind `auth/onboarding` to one account.
 *
 * `needsPassword` (no credential row) used to be the only gate on
 * onboarding, which also matched every OAuth-, passkey- and magic-link-only
 * account; anyone could walk in on that address and take it over. The
 * token an admin issues when inviting someone is now the actual proof.
 */

import { and, eq, gt, isNull } from "drizzle-orm";
import { type Database, db } from "#lib/server/db/index.js";
import { type Invite, invites } from "#lib/server/db/schema.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 32 hex chars from the CSPRNG, same shape as a share token. */
function generateToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createInvite(
	userId: string,
	createdBy: string | null,
	database: Database = db,
): Promise<string> {
	// A resend must not leave an older, still-valid link able to onboard the
	// same account a second time.
	await database
		.update(invites)
		.set({ expiresAt: new Date() })
		.where(and(eq(invites.userId, userId), isNull(invites.usedAt)));

	const token = generateToken();
	await database.insert(invites).values({
		id: crypto.randomUUID(),
		token,
		userId,
		createdBy,
		expiresAt: new Date(Date.now() + INVITE_TTL_MS),
	});
	return token;
}

/** Look up a token without consuming it, for rendering the onboarding form. */
export async function findValidInvite(
	token: string,
	database: Database = db,
): Promise<Invite | null> {
	if (!token) {
		return null;
	}
	const [invite] = await database
		.select()
		.from(invites)
		.where(
			and(
				eq(invites.token, token),
				isNull(invites.usedAt),
				gt(invites.expiresAt, new Date()),
			),
		)
		.limit(1);
	return invite ?? null;
}

/**
 * Mark a token used, atomically. Returns null for an unknown, already-used
 * or expired token; a second submit with the same token, or two racing
 * submits, never both succeed.
 */
export async function consumeInvite(
	token: string,
	database: Database = db,
): Promise<Invite | null> {
	const now = new Date();
	const [invite] = await database
		.update(invites)
		.set({ usedAt: now })
		.where(
			and(
				eq(invites.token, token),
				isNull(invites.usedAt),
				gt(invites.expiresAt, now),
			),
		)
		.returning();
	return invite ?? null;
}
