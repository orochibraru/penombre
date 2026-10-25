import {
	afterAll,
	afterEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "bun:test";
import * as dns from "node:dns/promises";

import { auth } from "#lib/server/auth/index.js";
import { migratedSqlite } from "#lib/server/db/test-utils.js";

const {
	authorizationServerMetadata,
	createAuthorizationCode,
	fetchClientMetadata,
	issueAccessToken,
	protectedResourceMetadata,
	readAuthorizeRequest,
	redeemAuthorizationCode,
	redirectAllowed,
	resourceMetadataUrl,
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

const CLIENT_ID = "https://client.example.com/oauth/metadata";

function respond(body: unknown, status = 200) {
	const fetcher = mock(async (_url: URL, _init?: RequestInit) =>
		typeof body === "string"
			? new Response(body, { status })
			: Response.json(body, { status }),
	);
	return fetcher;
}

const lookup = spyOn(dns, "lookup");

function resolvesTo(...addresses: string[]) {
	return lookup.mockResolvedValue(
		addresses.map((address) => ({
			address,
			family: address.includes(":") ? 6 : 4,
		})) as never,
	);
}

afterEach(() => {
	lookup.mockReset();
});

afterAll(() => {
	lookup.mockRestore();
});

describe("MCP OAuth metadata", () => {
	test("names this instance's origin as issuer and resource", () => {
		const url = new URL("https://proxy.internal/whatever");
		expect(protectedResourceMetadata(url)).toEqual({
			resource: "http://localhost:5173/mcp",
			authorization_servers: ["http://localhost:5173"],
			bearer_methods_supported: ["header"],
			resource_name: "Penombre",
		});
		expect(resourceMetadataUrl(url)).toBe(
			"http://localhost:5173/.well-known/oauth-protected-resource/mcp",
		);
		expect(authorizationServerMetadata(url)).toMatchObject({
			issuer: "http://localhost:5173",
			authorization_endpoint: "http://localhost:5173/auth/mcp/authorize",
			token_endpoint: "http://localhost:5173/mcp/token",
		});
	});
});

describe("client metadata", () => {
	test("reads a valid document, trimming its name", async () => {
		resolvesTo("93.184.216.34");
		const fetcher = respond({
			client_id: CLIENT_ID,
			client_name: `  ${"N".repeat(120)}  `,
			redirect_uris: ["https://client.example.com/callback"],
			token_endpoint_auth_method: "none",
		});
		const client = await fetchClientMetadata(CLIENT_ID, fetcher as never);
		expect(client).toEqual({
			clientId: CLIENT_ID,
			name: "N".repeat(100),
			redirectUris: ["https://client.example.com/callback"],
		});
		const [url, init] = fetcher.mock.calls[0] ?? [];
		expect(String(url)).toBe(CLIENT_ID);
		expect(init?.redirect).toBe("error");
	});

	test("falls back to the host name when the document has none", async () => {
		resolvesTo("2606:4700::1111");
		const client = await fetchClientMetadata(
			CLIENT_ID,
			respond({ client_id: CLIENT_ID, redirect_uris: [] }) as never,
		);
		expect(client.name).toBe("client.example.com");
	});

	test("refuses a name resolving to a private address", async () => {
		for (const address of [
			"10.1.2.3",
			"127.0.0.1",
			"0.0.0.0",
			"100.64.0.1",
			"169.254.169.254",
			"172.16.0.1",
			"192.168.1.1",
			"224.0.0.1",
			"::ffff:10.0.0.1",
			"::",
			"::1",
			"fc00::1",
			"fd12::1",
			"fe80::1",
			"fe90::1",
			"fea0::1",
			"feb0::1",
		]) {
			const spy = resolvesTo("93.184.216.34", address);
			const fetcher = respond({});
			await expect(
				fetchClientMetadata(CLIENT_ID, fetcher as never),
			).rejects.toThrow("public address");
			expect(fetcher).not.toHaveBeenCalled();
			expect(spy).toHaveBeenCalledWith("client.example.com", { all: true });
		}
	});

	test("refuses a name that does not resolve", async () => {
		lookup.mockRejectedValue(new Error("ENOTFOUND"));
		await expect(
			fetchClientMetadata(CLIENT_ID, respond({}) as never),
		).rejects.toThrow("public address");
	});

	test("refuses a document it cannot use", async () => {
		resolvesTo("93.184.216.34");
		const valid = { client_id: CLIENT_ID, redirect_uris: [] };
		const cases: [unknown, number, string][] = [
			[valid, 404, "could not be fetched"],
			["x".repeat(64 * 1024 + 1), 200, "too large"],
			["{not json", 200, "not JSON"],
			[{ ...valid, client_id: "https://other.example/m" }, 200, "invalid"],
			[{ ...valid, redirect_uris: "https://a.example" }, 200, "invalid"],
			[{ ...valid, redirect_uris: [3] }, 200, "invalid"],
			[
				{ ...valid, token_endpoint_auth_method: "client_secret_basic" },
				200,
				"invalid",
			],
		];
		for (const [body, status, message] of cases) {
			await expect(
				fetchClientMetadata(CLIENT_ID, respond(body, status) as never),
			).rejects.toThrow(message);
		}
		const failing = mock(async () => {
			throw new Error("reset");
		});
		await expect(
			fetchClientMetadata(CLIENT_ID, failing as never),
		).rejects.toThrow("could not be fetched");
	});
});

describe("authorize requests", () => {
	const good = {
		response_type: "code",
		code_challenge: CHALLENGE,
		code_challenge_method: "S256",
		client_id: CLIENT_ID,
		redirect_uri: "http://127.0.0.1:50123/callback",
		resource: "http://localhost:5173/mcp/",
		state: "s1",
	};
	const ask = (params: Record<string, string>) =>
		readAuthorizeRequest(
			new URL(`${BASE}?${new URLSearchParams(params)}`),
			respond({
				client_id: CLIENT_ID,
				client_name: "Client",
				redirect_uris: ["http://127.0.0.1/callback"],
			}) as never,
		);

	test("accepts a request matching the client's metadata", async () => {
		resolvesTo("93.184.216.34");
		expect(await ask(good)).toEqual({
			client: {
				clientId: CLIENT_ID,
				name: "Client",
				redirectUris: ["http://127.0.0.1/callback"],
			},
			redirectUri: good.redirect_uri,
			challenge: CHALLENGE,
			state: "s1",
		});
	});

	test("refuses a redirect the client never registered", async () => {
		resolvesTo("93.184.216.34");
		await expect(
			ask({ ...good, redirect_uri: "https://attacker.example/callback" }),
		).rejects.toThrow("redirect_uri");
	});

	test("refuses a challenge too short to be S256", async () => {
		await expect(ask({ ...good, code_challenge: "short" })).rejects.toThrow(
			"S256",
		);
	});
});

describe("access tokens", () => {
	test("are API keys named after the client, within the plugin's limit", async () => {
		const createApiKey = auth.api.createApiKey as unknown as ReturnType<
			typeof mock
		>;
		const token = await issueAccessToken({
			...pending,
			clientName: "A very long client name indeed, yes",
		});
		expect(token).toBe("mock-key");
		const [request] = createApiKey.mock.calls.at(-1) ?? [];
		expect(request).toEqual({
			body: { userId: "u1", name: "A very long client name in (MCP)" },
		});
		expect(request.body.name.length).toBeLessThanOrEqual(32);
	});
});
