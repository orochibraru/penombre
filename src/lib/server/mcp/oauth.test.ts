import { describe, expect, test } from "bun:test";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const {
	authorizationServerMetadata,
	createAuthorizationCode,
	fetchClientMetadata,
	readAuthorizeRequest,
	redeemAuthorizationCode,
	redirectAllowed,
} = await import("./oauth");

const VERIFIER = "dBjftJeZ4CVP-mJ92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = "ngF5GsXcbwljx6u133FFr3Xht9xooA_DuaX_3QwODtc";
const BASE = new URL("https://drive.example.com/auth/mcp/authorize");

const pending = {
	userId: "u1",
	clientId: "https://claude.ai/oauth/mcp-oauth-client-metadata",
	clientName: "Claude",
	redirectUri: "https://claude.ai/api/mcp/auth_callback",
	challenge: CHALLENGE,
};

describe("MCP OAuth", () => {
	test("advertises CIMD and PKCE", () => {
		const metadata = authorizationServerMetadata(BASE);
		expect(metadata.client_id_metadata_document_supported).toBe(true);
		expect(metadata.code_challenge_methods_supported).toEqual(["S256"]);
	});

	test("a code redeems once, for its client, redirect and verifier", async () => {
		const database = migratedSqlite();
		const grant = {
			verifier: VERIFIER,
			clientId: pending.clientId,
			redirectUri: pending.redirectUri,
		};
		const code = await createAuthorizationCode(pending, database);
		expect(await redeemAuthorizationCode({ ...grant, code }, database)).toEqual(
			pending,
		);
		expect(await redeemAuthorizationCode({ ...grant, code }, database)).toBe(
			null,
		);

		const other = await createAuthorizationCode(pending, database);
		expect(
			await redeemAuthorizationCode(
				{ ...grant, code: other, clientId: "https://evil.example/c" },
				database,
			),
		).toBeNull();
		// Burnt by the failed attempt.
		expect(
			await redeemAuthorizationCode({ ...grant, code: other }, database),
		).toBeNull();
	});

	test("redirects match exactly, or a loopback on any port", () => {
		const registered = [
			"https://claude.ai/api/mcp/auth_callback",
			"http://localhost/callback",
		];
		expect(
			redirectAllowed("https://claude.ai/api/mcp/auth_callback", registered),
		).toBe(true);
		expect(redirectAllowed("http://localhost:43123/callback", registered)).toBe(
			true,
		);
		expect(redirectAllowed("https://claude.ai/elsewhere", registered)).toBe(
			false,
		);
		expect(redirectAllowed("http://localhost:1/other", registered)).toBe(false);
		expect(redirectAllowed("http://claude.ai/api/mcp/auth_callback", [])).toBe(
			false,
		);
	});

	test("never fetches a private or plain-http client id", async () => {
		const fetcher = (() => {
			throw new Error("fetched");
		}) as unknown as typeof fetch;
		for (const clientId of [
			"http://claude.ai/metadata",
			"https://127.0.0.1/metadata",
			"https://[::1]/metadata",
			"https://localhost/metadata",
			"https://claude.ai/",
			"not a url",
		]) {
			await expect(fetchClientMetadata(clientId, fetcher)).rejects.toThrow();
		}
	});

	test("refuses a request without S256 or for another resource", async () => {
		const ask = (params: Record<string, string>) =>
			readAuthorizeRequest(
				new URL(`${BASE}?${new URLSearchParams(params)}`),
				() => {
					throw new Error("fetched");
				},
			);
		const good = {
			response_type: "code",
			code_challenge: CHALLENGE,
			code_challenge_method: "S256",
			client_id: pending.clientId,
			redirect_uri: pending.redirectUri,
		};
		await expect(
			ask({ ...good, code_challenge_method: "plain" }),
		).rejects.toThrow("S256");
		await expect(ask({ ...good, response_type: "token" })).rejects.toThrow(
			"response_type",
		);
		await expect(
			ask({ ...good, resource: "https://elsewhere.example/mcp" }),
		).rejects.toThrow("resource");
	});
});
