import { z } from "zod";
import {
	makeFolderNamed,
	relocate,
	resolve,
	trash,
	within,
	writeNamed,
} from "#lib/server/dav/handler.js";
import { isOfficeFile } from "#lib/server/office/index.js";
import type { StorageService } from "#lib/server/services/storage/index.js";
import {
	assertNamed,
	defineTool,
	entryAt,
	fileAt,
	headText,
	json,
	locate,
	MAX_TEXT_BYTES,
	shown,
	ToolRefusal,
	text,
} from "./tool";
import { transferUrl } from "./transfer";

const MAX_INLINE_BYTES = 10 * 1024 * 1024;

const WRITE = {
	readOnlyHint: false,
	destructiveHint: true,
	idempotentHint: true,
};

async function write(
	service: StorageService,
	segments: string[],
	bytes: Uint8Array,
): Promise<"Created" | "Replaced"> {
	const code = await writeNamed(service, segments, bytes);
	if (code === 405) {
		throw new ToolRefusal("A folder already has that name.");
	}
	if (code === 409) {
		throw new ToolRefusal(
			"The folder does not exist, or the name is taken by another casing of it.",
		);
	}
	return code === 201 ? "Created" : "Replaced";
}

async function parentFolder(service: StorageService, segments: string[]) {
	const parent = await resolve(service, segments.slice(0, -1));
	if (parent?.type !== "folder") {
		throw new ToolRefusal("The parent folder does not exist.");
	}
	return parent;
}

export const writeFile = defineTool({
	name: "write_file",
	title: "Write file",
	description:
		"Creates a file, or replaces an existing file's content. Text by default; base64 for small binary content such as a generated picture (up to 10 MB; larger files go through upload_link). A replaced file's previous content is kept as a version when versioning is on. The folder must exist.",
	input: z.object({
		path: z.string().describe("e.g. /me/Notes/todo.md"),
		content: z.string().describe("The whole new content"),
		encoding: z.enum(["utf-8", "base64"]).default("utf-8"),
	}),
	annotations: WRITE,
	run: async ({ path, content, encoding }, caller) => {
		const { loc, service } = await locate(path, caller);
		const name = assertNamed(loc.segments);
		if (encoding === "utf-8" && isOfficeFile(name)) {
			throw new ToolRefusal(
				"Office files cannot be written as text; upload the file itself.",
			);
		}
		const bytes =
			encoding === "base64"
				? Buffer.from(content, "base64")
				: new TextEncoder().encode(content);
		if (bytes.byteLength > MAX_INLINE_BYTES) {
			throw new ToolRefusal("Too large to send inline; use upload_link.");
		}
		return text(`${await write(service, loc.segments, bytes)} ${shown(path)}`);
	},
});

export const editFile = defineTool({
	name: "edit_file",
	title: "Edit file",
	description:
		"Replaces one exact piece of a text file with another, without resending the whole file. old_text must occur exactly once; include surrounding lines to make it unique.",
	input: z.object({
		path: z.string().describe("e.g. /me/Code/app/main.ts"),
		old_text: z.string().min(1),
		new_text: z.string(),
	}),
	annotations: { ...WRITE, idempotentHint: false },
	run: async ({ path, old_text: before, new_text: after }, caller) => {
		const { loc, service } = await locate(path, caller);
		const entry = await fileAt(service, loc.segments);
		const head = await headText(service, entry);
		if (!head || head.size > MAX_TEXT_BYTES) {
			throw new ToolRefusal(
				"Only text files up to 1 MB can be edited; use download_link and upload_link.",
			);
		}
		const count = head.text.split(before).length - 1;
		if (count !== 1) {
			throw new ToolRefusal(
				count === 0
					? "old_text was not found."
					: `old_text occurs ${count} times; include more context.`,
			);
		}
		const edited = head.text.replace(before, () => after);
		await write(service, loc.segments, new TextEncoder().encode(edited));
		return text(`Edited ${shown(path)}`);
	},
});

export const uploadLink = defineTool({
	name: "upload_link",
	title: "Upload link",
	description:
		"A URL that accepts one file's bytes for 15 minutes, with no other credential: `curl -fT <local file> '<url>'`. Creates the file, or replaces it (its previous content kept as a version when versioning is on). For media, archives and anything too large for write_file. The folder must exist.",
	input: z.object({ path: z.string().describe("e.g. /me/Videos/edit.mp4") }),
	annotations: WRITE,
	run: async ({ path }, caller) => {
		const { loc, service } = await locate(path, caller);
		assertNamed(loc.segments);
		await parentFolder(service, loc.segments);
		return json(
			transferUrl(caller.url, {
				user: caller.user.id,
				owner: caller.owner.id,
				path: shown(path),
				method: "PUT",
			}),
		);
	},
});

export const createFolder = defineTool({
	name: "create_folder",
	title: "Create folder",
	description: "Creates one folder. Its parent must exist.",
	input: z.object({ path: z.string().describe("e.g. /me/Projects/2026") }),
	annotations: { readOnlyHint: false, destructiveHint: false },
	run: async ({ path }, caller) => {
		const { loc, service } = await locate(path, caller);
		assertNamed(loc.segments);
		const code = await makeFolderNamed(service, loc.segments);
		if (code === 405) {
			throw new ToolRefusal("Something already has that name.");
		}
		if (code === 409) {
			throw new ToolRefusal("The parent folder does not exist.");
		}
		return text(`Created ${shown(path)}`);
	},
});

export const move = defineTool({
	name: "move",
	title: "Move or rename",
	description:
		"Moves or renames a file or folder within one place, keeping its notes, versions and shares. Refuses to overwrite anything.",
	input: z.object({
		from: z.string().describe("e.g. /me/Inbox/draft.txt"),
		to: z.string().describe("e.g. /me/Notes/final.txt"),
	}),
	annotations: { readOnlyHint: false, destructiveHint: false },
	run: async ({ from, to }, caller) => {
		const source = await locate(from, caller);
		const target = await locate(to, caller);
		if (source.loc.base !== target.loc.base) {
			throw new ToolRefusal(
				"Moving between places is not supported; download and upload instead.",
			);
		}
		const { service } = source;
		assertNamed(source.loc.segments);
		const name = assertNamed(target.loc.segments);
		if (within(target.loc.segments, source.loc.segments)) {
			throw new ToolRefusal("A folder cannot move into itself.");
		}
		const entry = await entryAt(service, source.loc.segments);
		const parent = await parentFolder(service, target.loc.segments);
		const existing = await service.treeEntry(parent.path, name);
		if (existing && existing.id !== entry.id) {
			throw new ToolRefusal("Something is already at the destination.");
		}
		await relocate(service, entry, parent.path, name);
		return text(`Moved ${shown(from)} to ${shown(to)}`);
	},
});

export const trashItem = defineTool({
	name: "trash",
	title: "Move to trash",
	description:
		"Sends a file or folder to its place's trash, from where it can be restored in Penombre.",
	input: z.object({ path: z.string().describe("e.g. /me/Inbox/old.txt") }),
	annotations: { readOnlyHint: false, destructiveHint: true },
	run: async ({ path }, caller) => {
		const { loc, service } = await locate(path, caller);
		assertNamed(loc.segments);
		await trash(service, await entryAt(service, loc.segments));
		return text(`Trashed ${shown(path)}`);
	},
});
