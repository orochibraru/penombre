import { z } from "zod";
import { Logger } from "#lib/logger.js";
import {
	DriveAccessError,
	FileOrFolderNotFoundError,
	ReadOnlyVolumeError,
	StorageUnavailableError,
} from "#lib/server/errors.js";
import {
	downloadLink,
	listFolder,
	listPlaces,
	readFile,
	search,
} from "./read-tools";
import { type Caller, PATH_HELP, ToolRefusal, type ToolResult } from "./tool";
import {
	createFolder,
	editFile,
	move,
	trashItem,
	uploadLink,
	writeFile,
} from "./write-tools";

const logger = new Logger("MCP");

export const TOOLS = [
	listPlaces,
	listFolder,
	search,
	readFile,
	downloadLink,
	writeFile,
	editFile,
	uploadLink,
	createFolder,
	move,
	trashItem,
];

export function describeTools() {
	return TOOLS.map((tool) => ({
		name: tool.name,
		title: tool.title,
		description: tool.description,
		inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
		annotations: tool.annotations,
	}));
}

/** What the model is told when storage refuses, or undefined for a real failure. */
export function refusalOf(error: unknown): string | undefined {
	if (error instanceof ToolRefusal) {
		return error.message;
	}
	if (error instanceof DriveAccessError) {
		return `No such place. ${PATH_HELP}`;
	}
	if (error instanceof FileOrFolderNotFoundError) {
		return `Nothing at that path. ${PATH_HELP}`;
	}
	if (error instanceof ReadOnlyVolumeError) {
		return "That place is read-only.";
	}
	if (error instanceof StorageUnavailableError) {
		return "That place cannot be reached right now.";
	}
}

/** undefined when there is no such tool. */
export async function callTool(
	name: string,
	args: unknown,
	caller: Caller,
): Promise<ToolResult | undefined> {
	const tool = TOOLS.find((candidate) => candidate.name === name);
	if (!tool) {
		return;
	}
	const parsed = tool.input.safeParse(args ?? {});
	if (!parsed.success) {
		return {
			content: [{ type: "text", text: z.prettifyError(parsed.error) }],
			isError: true,
		};
	}
	try {
		return await tool.run(parsed.data, caller);
	} catch (error) {
		const refusal = refusalOf(error);
		if (refusal) {
			return { content: [{ type: "text", text: refusal }], isError: true };
		}
		logger.error(`Tool ${name} failed`, error);
		return {
			content: [{ type: "text", text: "Internal error" }],
			isError: true,
		};
	}
}
