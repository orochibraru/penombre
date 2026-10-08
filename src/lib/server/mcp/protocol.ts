import { getConfig } from "#lib/server/config.js";
import type { Caller } from "./tool";
import { callTool, describeTools } from "./tools";

/**
 * MCP over Streamable HTTP, stateless: every POST is one JSON-RPC message
 * answered with JSON, no session and no SSE stream. Tools are all this server
 * offers, so nothing ever needs to reach the client unasked.
 */

const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"];

const INSTRUCTIONS =
	"Penombre is a self-hosted drive. Paths are display names under a place: /me for the account's own drive, /drives/<id> for a shared drive, /volumes/<name> for a mounted volume. Start with list_places or search.";

interface Message {
	jsonrpc?: unknown;
	id?: unknown;
	method?: unknown;
	params?: Record<string, unknown>;
}

function reply(id: unknown, result: unknown): Response {
	return Response.json({ jsonrpc: "2.0", id, result });
}

function failure(id: unknown, code: number, message: string): Response {
	return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function handleMcp(
	request: Request,
	caller: Caller,
): Promise<Response> {
	const version = request.headers.get("mcp-protocol-version");
	if (version && !VERSIONS.includes(version)) {
		return new Response(`Unsupported MCP-Protocol-Version: ${version}`, {
			status: 400,
		});
	}
	let message: Message;
	try {
		message = await request.json();
	} catch {
		return failure(null, -32700, "Parse error");
	}
	if (
		typeof message !== "object" ||
		message === null ||
		Array.isArray(message) ||
		message.jsonrpc !== "2.0"
	) {
		return failure(null, -32600, "Invalid request");
	}
	// Notifications and the client's own responses carry nothing to answer.
	if (message.id === undefined || message.method === undefined) {
		return new Response(null, { status: 202 });
	}
	const { id, params } = message;
	switch (message.method) {
		case "initialize": {
			const asked = params?.protocolVersion;
			return reply(id, {
				protocolVersion:
					typeof asked === "string" && VERSIONS.includes(asked)
						? asked
						: VERSIONS[0],
				capabilities: { tools: {} },
				serverInfo: {
					name: "penombre",
					title: "Penombre",
					version: getConfig().appVersion,
				},
				instructions: INSTRUCTIONS,
			});
		}
		case "ping":
			return reply(id, {});
		case "tools/list":
			return reply(id, { tools: describeTools() });
		case "tools/call": {
			const name = typeof params?.name === "string" ? params.name : "";
			const result = await callTool(name, params?.arguments, caller);
			return result
				? reply(id, result)
				: failure(id, -32602, `Unknown tool: ${name}`);
		}
		default:
			return failure(id, -32601, "Method not found");
	}
}
