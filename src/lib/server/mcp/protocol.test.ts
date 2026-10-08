import { describe, expect, test } from "bun:test";
import { handleMcp } from "./protocol";
import type { Caller } from "./tool";

const user = { id: "u1", name: "Ada" } as Caller["user"];
const caller: Caller = {
	user,
	owner: user,
	locals: { user } as App.Locals,
	url: new URL("http://penombre.test/mcp"),
};

function post(body: unknown, headers: Record<string, string> = {}) {
	return handleMcp(
		new Request("http://penombre.test/mcp", {
			method: "POST",
			headers: { "content-type": "application/json", ...headers },
			body: typeof body === "string" ? body : JSON.stringify(body),
		}),
		caller,
	);
}

async function rpc(method: string, params?: unknown) {
	const response = await post({ jsonrpc: "2.0", id: 7, method, params });
	return response.json();
}

describe("handleMcp", () => {
	test("initialize echoes a supported version and offers tools", async () => {
		const body = await rpc("initialize", { protocolVersion: "2025-06-18" });
		expect(body.id).toBe(7);
		expect(body.result.protocolVersion).toBe("2025-06-18");
		expect(body.result.capabilities).toEqual({ tools: {} });
		expect(body.result.serverInfo.name).toBe("penombre");
	});

	test("initialize answers an unknown version with its newest", async () => {
		const body = await rpc("initialize", { protocolVersion: "1999-01-01" });
		expect(body.result.protocolVersion).toBe("2025-11-25");
	});

	test("refuses an unsupported protocol header", async () => {
		const response = await post(
			{ jsonrpc: "2.0", id: 1, method: "ping" },
			{ "mcp-protocol-version": "1999-01-01" },
		);
		expect(response.status).toBe(400);
	});

	test("accepts notifications without a body", async () => {
		const response = await post({
			jsonrpc: "2.0",
			method: "notifications/initialized",
		});
		expect(response.status).toBe(202);
		expect(await response.text()).toBe("");
	});

	test("reports parse errors, invalid requests and unknown methods", async () => {
		expect((await (await post("{nope")).json()).error.code).toBe(-32700);
		expect((await (await post([1])).json()).error.code).toBe(-32600);
		expect((await rpc("resources/list")).error.code).toBe(-32601);
	});

	test("lists every tool with an object input schema", async () => {
		const { tools } = (await rpc("tools/list")).result;
		expect(tools.map((tool: { name: string }) => tool.name)).toEqual([
			"list_places",
			"list_folder",
			"search",
			"read_file",
			"download_link",
			"write_file",
			"edit_file",
			"upload_link",
			"create_folder",
			"move",
			"trash",
		]);
		for (const tool of tools) {
			expect(tool.inputSchema.type).toBe("object");
		}
		const search = tools.find(
			(tool: { name: string }) => tool.name === "search",
		);
		expect(search.inputSchema.required).toEqual(["query"]);
	});

	test("an unknown tool is a protocol error", async () => {
		const body = await rpc("tools/call", { name: "rm_rf", arguments: {} });
		expect(body.error.code).toBe(-32602);
	});

	test("bad arguments and bad paths come back as tool errors", async () => {
		const missing = await rpc("tools/call", {
			name: "list_folder",
			arguments: {},
		});
		expect(missing.result.isError).toBe(true);

		const outside = await rpc("tools/call", {
			name: "list_folder",
			arguments: { path: "/etc/passwd" },
		});
		expect(outside.result.isError).toBe(true);
		expect(outside.result.content[0].text).toContain("Not a Penombre path");

		const escape = await rpc("tools/call", {
			name: "read_file",
			arguments: { path: "/me/../../secret" },
		});
		expect(escape.result.isError).toBe(true);
	});
});
