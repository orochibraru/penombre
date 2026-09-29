/**
 * Sign-in for the mobile app: an authorization code grant with PKCE whose
 * result is an ordinary better-auth session, so it is listed and revocable
 * under Account → Sessions like any browser.
 */

import { makeSignature } from "better-auth/crypto";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "#lib/server/auth/index.js";
import { type Database, db } from "#lib/server/db/index.js";
import { verification } from "#lib/server/db/schema.js";

export const MOBILE_REDIRECT = "penombre://auth";
const CODE_TTL_MS = 60_000;
const PREFIX = "mobile-code:";

interface Pending {
	userId: string;
	challenge: string;
	device: string;
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
	return Buffer.from(bytes as ArrayBuffer).toString("base64url");
}

function sha256(value: string): Promise<ArrayBuffer> {
	return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

/** RFC 7636 S256: the challenge is base64url(sha256(verifier)). */
export async function verifierMatches(
	verifier: string,
	challenge: string,
): Promise<boolean> {
	return base64url(await sha256(verifier)) === challenge;
}

/** A single-use code bound to the user and the app's PKCE challenge. */
export async function createMobileCode(
	pending: Pending,
	database: Database = db,
): Promise<string> {
	const code = base64url(crypto.getRandomValues(new Uint8Array(32)));
	await database.insert(verification).values({
		id: crypto.randomUUID(),
		// Hashed: a leaked row must not be a usable code.
		identifier: PREFIX + base64url(await sha256(code)),
		value: JSON.stringify(pending),
		expiresAt: new Date(Date.now() + CODE_TTL_MS),
	});
	return code;
}

/**
 * Consumes the code atomically (`delete … returning`), so two racing token
 * requests never both succeed; a wrong verifier burns it too.
 */
export async function redeemMobileCode(
	code: string,
	verifier: string,
	database: Database = db,
): Promise<Omit<Pending, "challenge"> | null> {
	const [row] = await database
		.delete(verification)
		.where(
			and(
				eq(verification.identifier, PREFIX + base64url(await sha256(code))),
				gt(verification.expiresAt, new Date()),
			),
		)
		.returning();
	if (!row) {
		return null;
	}
	const pending = JSON.parse(row.value) as Pending;
	if (!(await verifierMatches(verifier, pending.challenge))) {
		return null;
	}
	return { userId: pending.userId, device: pending.device };
}

/** A new session plus the signed cookie the app plants in its WebView. */
export async function createMobileSession(userId: string, device: string) {
	const ctx = await auth.$context;
	const session = await ctx.internalAdapter.createSession(userId, false, {
		userAgent: `Penombre mobile · ${device}`.slice(0, 200),
	});
	const signed = `${session.token}.${await makeSignature(session.token, ctx.secret)}`;
	return {
		token: session.token,
		expiresAt: session.expiresAt,
		cookie: {
			name: ctx.authCookies.sessionToken.name,
			value: encodeURIComponent(signed),
		},
	};
}
