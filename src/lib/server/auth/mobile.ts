/**
 * Sign-in for the mobile app: an authorization code grant with PKCE whose
 * result is an ordinary better-auth session, so it is listed and revocable
 * under Account → Sessions like any browser.
 */

import { makeSignature } from "better-auth/crypto";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "#lib/server/auth/index.js";
import { type Database, db } from "#lib/server/db/index.js";
import { session, verification } from "#lib/server/db/schema.js";

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

const PAIR_TTL_MS = 2 * 60_000;
const PAIR_PREFIX = "mobile-pair:";

/** What the QR code says: the app opens it as a link, or reads it itself. */
export function pairingUrl(server: string, code: string): string {
	return `penombre://pair?server=${encodeURIComponent(server)}&code=${code}`;
}

/**
 * A single-use code a signed-in browser shows as a QR code: whoever scans it
 * within two minutes is signed in as that account. No PKCE here, the phone
 * has never spoken to this server, so the code alone is the proof; it lives
 * under its own prefix so neither kind of code redeems as the other.
 */
export async function createPairCode(
	userId: string,
	database: Database = db,
): Promise<{ code: string; expiresAt: Date }> {
	const code = base64url(crypto.getRandomValues(new Uint8Array(32)));
	const expiresAt = new Date(Date.now() + PAIR_TTL_MS);
	await database.insert(verification).values({
		id: crypto.randomUUID(),
		identifier: PAIR_PREFIX + base64url(await sha256(code)),
		value: userId,
		expiresAt,
	});
	return { code, expiresAt };
}

/** The account the code was shown by; consumed like a sign-in code. */
export async function redeemPairCode(
	code: string,
	database: Database = db,
): Promise<string | null> {
	const [row] = await database
		.delete(verification)
		.where(
			and(
				eq(
					verification.identifier,
					PAIR_PREFIX + base64url(await sha256(code)),
				),
				gt(verification.expiresAt, new Date()),
			),
		)
		.returning();
	return row?.value ?? null;
}

/** How the app's sessions read under Account → Sessions. */
export function mobileLabel(device: string): string {
	return `Penombre mobile · ${device}`.slice(0, 200);
}

/** A new session plus the signed cookie the app plants in its WebView. */
export async function createMobileSession(userId: string, device: string) {
	const ctx = await auth.$context;
	const created = await ctx.internalAdapter.createSession(userId, false, {
		userAgent: mobileLabel(device),
	});
	const signed = `${created.token}.${await makeSignature(created.token, ctx.secret)}`;
	return {
		token: created.token,
		expiresAt: created.expiresAt,
		cookie: {
			name: ctx.authCookies.sessionToken.name,
			value: encodeURIComponent(signed),
		},
	};
}

/**
 * Names a session the app made itself, with an emailed code: better-auth
 * labelled it with the HTTP client's user agent, and a phone's HTTP stack
 * refuses the `·` in a header. Only the caller's own session.
 */
export async function labelMobileSession(
	sessionId: string,
	device: string,
	database: Database = db,
): Promise<string> {
	const userAgent = mobileLabel(device);
	await database
		.update(session)
		.set({ userAgent })
		.where(eq(session.id, sessionId));
	return userAgent;
}
