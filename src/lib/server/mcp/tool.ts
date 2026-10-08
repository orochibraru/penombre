import type { z } from "zod";
import { dropped, resolve } from "#lib/server/dav/handler.js";
import { parseDavPath } from "#lib/server/dav/location.js";
import type { Place } from "#lib/server/services/search.js";
import type { StorageService } from "#lib/server/services/storage/index.js";
import type { TreeEntry } from "#lib/server/services/storage/listings.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

type User = NonNullable<App.Locals["user"]>;

export interface Caller {
	user: User;
	owner: User;
	locals: App.Locals;
	url: URL;
}

export type Content =
	| { type: "text"; text: string }
	| { type: "image"; data: string; mimeType: string };

export interface ToolResult {
	content: Content[];
	isError?: boolean;
}

export interface Tool<Input extends z.ZodObject = z.ZodObject> {
	name: string;
	title: string;
	description: string;
	input: Input;
	annotations: {
		readOnlyHint: boolean;
		destructiveHint?: boolean;
		idempotentHint?: boolean;
	};
	run: (args: z.infer<Input>, caller: Caller) => Promise<ToolResult>;
}

export function defineTool<Input extends z.ZodObject>(tool: Tool<Input>): Tool {
	return tool as unknown as Tool;
}

/** Refused to the model as a result, not a protocol error, so it can recover. */
export class ToolRefusal extends Error {}

export const MAX_TEXT_BYTES = 1024 * 1024;

export const PATH_HELP =
	"Paths are display names under a place: /me/…, /drives/<id>/… or /volumes/<name>/…; list_places names them.";

export function text(value: string): ToolResult {
	return { content: [{ type: "text", text: value }] };
}

export function json(value: unknown): ToolResult {
	return text(JSON.stringify(value, null, 2));
}

export function placePath(place: Place): string {
	if (place.kind === "drive") {
		return `/drives/${place.id}`;
	}
	if (place.kind === "volume") {
		return `/volumes/${place.id}`;
	}
	return "/me";
}

export function shown(path: string): string {
	return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

export async function locate(path: string, caller: Caller) {
	const loc = parseDavPath(`/dav/${path.replace(/^\/+/, "")}`);
	if (!loc) {
		throw new ToolRefusal(`Not a Penombre path: ${path}. ${PATH_HELP}`);
	}
	const service = await storageServiceFor(caller.owner, {
		url: new URL(`/?${loc.query}`, caller.url),
		locals: caller.locals,
	});
	return { loc, service };
}

export async function entryAt(
	service: StorageService,
	segments: string[],
): Promise<TreeEntry> {
	const entry = dropped(segments) ? null : await resolve(service, segments);
	if (!entry) {
		throw new ToolRefusal(`Nothing at that path. ${PATH_HELP}`);
	}
	return entry;
}

export async function fileAt(
	service: StorageService,
	segments: string[],
): Promise<TreeEntry> {
	const entry = await entryAt(service, segments);
	if (entry.type !== "file") {
		throw new ToolRefusal("That is a folder; use list_folder.");
	}
	return entry;
}

export function assertNamed(segments: string[]): string {
	const name = segments.at(-1);
	if (!name || dropped(segments)) {
		throw new ToolRefusal("The path must end with a name.");
	}
	return name;
}

/** Up to `MAX_TEXT_BYTES` of a file as text, or null when it is binary. */
export async function headText(
	service: StorageService,
	entry: TreeEntry,
): Promise<{ text: string; size: number } | null> {
	const file = await service.openRawFile(entry.path);
	if (!file) {
		throw new ToolRefusal(`Nothing at that path. ${PATH_HELP}`);
	}
	const head = new Uint8Array(
		await new Response(
			file.size > 0 ? await file.stream(0, MAX_TEXT_BYTES - 1) : null,
		).arrayBuffer(),
	);
	if (head.subarray(0, 8192).includes(0)) {
		return null;
	}
	return { text: new TextDecoder().decode(head), size: file.size };
}
