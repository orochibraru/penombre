/**
 * OAuth for MCP clients, the way the MCP spec's authorization section asks:
 * protected-resource and authorization-server metadata, an authorization code
 * grant with PKCE, and clients identified by a Client ID Metadata Document
 * (CIMD), so nothing is registered here. The access token is an ordinary API
 * key named after the client, revoked under Settings → API keys.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "#lib/server/auth/index.js";
import { verifierMatches } from "#lib/server/auth/mobile.js";
import { getConfig } from "#lib/server/config.js";
import { type Database, db } from "#lib/server/db/index.js";
import { verification } from "#lib/server/db/schema.js";

export const AUTHORIZE_PATH = "/auth/mcp/authorize";
export const TOKEN_PATH = "/mcp/token";
const CODE_TTL_MS = 60_000;
const PREFIX = "mcp-code:";
const MAX_METADATA_BYTES = 64 * 1024;

export function issuer(url: URL): string {
	return URL.parse(getConfig().origin)?.origin ?? url.origin;
}

export function resourceUrl(url: URL): string {
	return `${issuer(url)}/mcp`;
}

export function resourceMetadataUrl(url: URL): string {
	return `${issuer(url)}/.well-known/oauth-protected-resource/mcp`;
}

export function protectedResourceMetadata(url: URL) {
	return {
		resource: resourceUrl(url),
		authorization_servers: [issuer(url)],
		bearer_methods_supported: ["header"],
		resource_name: "Penombre",
	};
}

export function authorizationServerMetadata(url: URL) {
	const base = issuer(url);
	return {
		issuer: base,
		authorization_endpoint: base + AUTHORIZE_PATH,
		token_endpoint: base + TOKEN_PATH,
		response_types_supported: ["code"],
		grant_types_supported: ["authorization_code"],
		code_challenge_methods_supported: ["S256"],
		token_endpoint_auth_methods_supported: ["none"],
		client_id_metadata_document_supported: true,
		authorization_response_iss_parameter_supported: true,
	};
}

export class OAuthRefusal extends Error {}

function isPrivateAddress(address: string): boolean {
	const v4 = address.replace(/^::ffff:/i, "");
	if (isIP(v4) === 4) {
		const [a = 0, b = 0] = v4.split(".").map(Number);
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b < 128) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b < 32) ||
			(a === 192 && b === 168) ||
			a >= 224
		);
	}
	const v6 = address.toLowerCase();
	return (
		v6 === "::" ||
		v6 === "::1" ||
		v6.startsWith("fc") ||
		v6.startsWith("fd") ||
		v6.startsWith("fe8") ||
		v6.startsWith("fe9") ||
		v6.startsWith("fea") ||
		v6.startsWith("feb")
	);
}

/** Only a public HTTPS name: whoever crafts the link picks what we fetch. */
async function assertPublic(clientId: URL): Promise<void> {
	const host = clientId.hostname.replace(/^\[|\]$/g, "");
	if (
		clientId.protocol !== "https:" ||
		clientId.pathname === "/" ||
		clientId.username ||
		clientId.password ||
		clientId.hash ||
		isIP(host) !== 0 ||
		host === "localhost" ||
		host.endsWith(".localhost")
	) {
		throw new OAuthRefusal("client_id must be a public https URL with a path");
	}
	const addresses = await lookup(host, { all: true }).catch(() => []);
	if (
		addresses.length === 0 ||
		addresses.some(({ address }) => isPrivateAddress(address))
	) {
		throw new OAuthRefusal("client_id does not resolve to a public address");
	}
}

export interface ClientMetadata {
	clientId: string;
	name: string;
	redirectUris: string[];
}

export async function fetchClientMetadata(
	clientId: string,
	fetcher: typeof fetch = fetch,
): Promise<ClientMetadata> {
	const url = URL.parse(clientId);
	if (!url) {
		throw new OAuthRefusal("client_id is not a URL");
	}
	await assertPublic(url);
	const response = await fetcher(url, {
		redirect: "error",
		signal: AbortSignal.timeout(5000),
		headers: { accept: "application/json" },
	}).catch(() => null);
	if (!response?.ok) {
		throw new OAuthRefusal("client metadata could not be fetched");
	}
	const body = await response.text();
	if (body.length > MAX_METADATA_BYTES) {
		throw new OAuthRefusal("client metadata is too large");
	}
	let document: Record<string, unknown>;
	try {
		document = JSON.parse(body);
	} catch {
		throw new OAuthRefusal("client metadata is not JSON");
	}
	const redirects = document.redirect_uris;
	const method = document.token_endpoint_auth_method;
	if (
		document.client_id !== clientId ||
		!Array.isArray(redirects) ||
		!redirects.every((uri) => typeof uri === "string") ||
		(method !== undefined && method !== "none")
	) {
		throw new OAuthRefusal("client metadata is invalid");
	}
	const name =
		typeof document.client_name === "string" && document.client_name.trim()
			? document.client_name.trim().slice(0, 100)
			: url.hostname;
	return { clientId, name, redirectUris: redirects };
}

function isLoopback(url: URL): boolean {
	return (
		url.protocol === "http:" &&
		["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
	);
}

/** Exact, except a native client's loopback port, which RFC 8252 lets vary. */
export function redirectAllowed(
	redirectUri: string,
	registered: string[],
): boolean {
	const asked = URL.parse(redirectUri);
	if (!asked || (asked.protocol !== "https:" && !isLoopback(asked))) {
		return false;
	}
	return registered.some((uri) => {
		if (uri === redirectUri) {
			return true;
		}
		const allowed = URL.parse(uri);
		return (
			!!allowed &&
			isLoopback(allowed) &&
			isLoopback(asked) &&
			allowed.hostname === asked.hostname &&
			allowed.pathname === asked.pathname &&
			allowed.search === asked.search
		);
	});
}

export interface AuthorizeRequest {
	client: ClientMetadata;
	redirectUri: string;
	challenge: string;
	state: string | null;
}

/** The request, checked against the client's own metadata. */
export async function readAuthorizeRequest(
	url: URL,
	fetcher?: typeof fetch,
): Promise<AuthorizeRequest> {
	const params = url.searchParams;
	const challenge = params.get("code_challenge") ?? "";
	const resource = params.get("resource");
	if (params.get("response_type") !== "code") {
		throw new OAuthRefusal("response_type must be code");
	}
	if (
		params.get("code_challenge_method") !== "S256" ||
		!/^[\w-]{43,128}$/.test(challenge)
	) {
		throw new OAuthRefusal("an S256 code_challenge is required");
	}
	if (resource && resource.replace(/\/$/, "") !== resourceUrl(url)) {
		throw new OAuthRefusal("resource is not this server's MCP endpoint");
	}
	const client = await fetchClientMetadata(
		params.get("client_id") ?? "",
		fetcher,
	);
	const redirectUri = params.get("redirect_uri") ?? "";
	if (!redirectAllowed(redirectUri, client.redirectUris)) {
		throw new OAuthRefusal("redirect_uri is not one the client registered");
	}
	return {
		client,
		redirectUri,
		challenge,
		state: params.get("state"),
	};
}

interface Pending {
	userId: string;
	clientId: string;
	clientName: string;
	redirectUri: string;
	challenge: string;
}

async function hashed(code: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(code),
	);
	return PREFIX + Buffer.from(digest).toString("base64url");
}

export async function createAuthorizationCode(
	pending: Pending,
	database: Database = db,
): Promise<string> {
	const code = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
		"base64url",
	);
	await database.insert(verification).values({
		id: crypto.randomUUID(),
		identifier: await hashed(code),
		value: JSON.stringify(pending),
		expiresAt: new Date(Date.now() + CODE_TTL_MS),
	});
	return code;
}

/** Consumed whatever the outcome, so a wrong verifier burns the code. */
export async function redeemAuthorizationCode(
	grant: {
		code: string;
		verifier: string;
		clientId: string;
		redirectUri: string;
	},
	database: Database = db,
): Promise<Pending | null> {
	const [row] = await database
		.delete(verification)
		.where(
			and(
				eq(verification.identifier, await hashed(grant.code)),
				gt(verification.expiresAt, new Date()),
			),
		)
		.returning();
	if (!row) {
		return null;
	}
	const pending = JSON.parse(row.value) as Pending;
	const matches =
		pending.clientId === grant.clientId &&
		pending.redirectUri === grant.redirectUri &&
		(await verifierMatches(grant.verifier, pending.challenge));
	return matches ? pending : null;
}

export async function issueAccessToken(pending: Pending): Promise<string> {
	const created = await auth.api.createApiKey({
		body: {
			userId: pending.userId,
			// The plugin refuses a name over 32 characters.
			name: `${pending.clientName.slice(0, 26)} (MCP)`,
		},
	});
	return created.key;
}
