import { z } from "zod";
import { Logger } from "#lib/logger.js";
import { isOfficeFile, officeToText } from "#lib/server/office/index.js";
import { places } from "#lib/server/services/search.js";
import {
	defineTool,
	entryAt,
	fileAt,
	headText,
	json,
	locate,
	MAX_TEXT_BYTES,
	PATH_HELP,
	placePath,
	shown,
	ToolRefusal,
	text,
} from "./tool";
import { transferUrl } from "./transfer";

const logger = new Logger("MCP");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_OFFICE_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
]);

const pathInput = (example: string) =>
	z.object({ path: z.string().describe(`e.g. ${example}`) });

export const listPlaces = defineTool({
	name: "list_places",
	title: "List places",
	description:
		"The drives this account can open: its own drive (/me), the shared drives it belongs to and the mounted volumes. Every other tool takes a path under one of these.",
	input: z.object({}),
	annotations: { readOnlyHint: true },
	run: async (_args, caller) =>
		json(
			(await places(caller.user, caller.owner)).map(({ place }) => ({
				path: placePath(place),
				name: place.name,
			})),
		),
});

export const listFolder = defineTool({
	name: "list_folder",
	title: "List folder",
	description:
		"The files and folders directly inside a folder, folders first. Pass a place (/me) for its top level.",
	input: pathInput("/me/Music"),
	annotations: { readOnlyHint: true },
	run: async ({ path }, caller) => {
		const { loc, service } = await locate(path, caller);
		const folder = await entryAt(service, loc.segments);
		if (folder.type !== "folder") {
			throw new ToolRefusal("That is a file; use read_file.");
		}
		const base = shown(path);
		return json(
			((await service.treeEntries(folder.path)) ?? []).map((entry) => ({
				path: `${base}/${entry.name}`,
				type: entry.type,
				...(entry.type === "file"
					? { size: entry.size, contentType: entry.contentType }
					: {}),
				modified: entry.updatedAt.toISOString(),
			})),
		);
	},
});

export const readFile = defineTool({
	name: "read_file",
	title: "Read file",
	description:
		"A file's content: text as text, PNG/JPEG/GIF/WebP as an image, Word documents as HTML, spreadsheets and decks as JSON. Anything else (video, audio, archives) is described; fetch its bytes with download_link.",
	input: pathInput("/me/Notes/todo.md"),
	annotations: { readOnlyHint: true },
	run: async ({ path }, caller) => {
		const { loc, service } = await locate(path, caller);
		const entry = await fileAt(service, loc.segments);
		const about = `${entry.name}: ${entry.contentType}, ${entry.size} bytes`;
		if (IMAGE_TYPES.has(entry.contentType) || isOfficeFile(entry.name)) {
			const isImage = IMAGE_TYPES.has(entry.contentType);
			if (entry.size > (isImage ? MAX_IMAGE_BYTES : MAX_OFFICE_BYTES)) {
				return text(`${about}. Too large to return; use download_link.`);
			}
			const raw = await service.getRawFileData(entry.path);
			if (!raw) {
				throw new ToolRefusal(`Nothing at that path. ${PATH_HELP}`);
			}
			return isImage
				? {
						content: [
							{
								type: "image",
								data: Buffer.from(raw.buffer).toString("base64"),
								mimeType: entry.contentType,
							},
						],
					}
				: text(officeToText(entry.name, raw.buffer));
		}
		const head = await headText(service, entry);
		if (!head) {
			return text(`${about}. Binary; use download_link for its bytes.`);
		}
		return text(
			head.size > MAX_TEXT_BYTES
				? `${head.text}\n\n[Truncated: first ${MAX_TEXT_BYTES} of ${head.size} bytes]`
				: head.text,
		);
	},
});

export const downloadLink = defineTool({
	name: "download_link",
	title: "Download link",
	description:
		"A URL that serves one file's bytes for 15 minutes, with no other credential: `curl -f -o <local file> '<url>'`. For media, archives and anything too large for read_file. Supports Range requests.",
	input: pathInput("/me/Videos/clip.mp4"),
	annotations: { readOnlyHint: true },
	run: async ({ path }, caller) => {
		const { loc, service } = await locate(path, caller);
		const entry = await fileAt(service, loc.segments);
		return json({
			...transferUrl(caller.url, {
				user: caller.user.id,
				owner: caller.owner.id,
				path: shown(path),
				method: "GET",
			}),
			size: entry.size,
			contentType: entry.contentType,
		});
	},
});

export const search = defineTool({
	name: "search",
	title: "Search",
	description:
		"Files and folders whose name contains the query, across every place this account can open.",
	input: z.object({
		query: z.string().min(1).describe("Part of a file or folder name"),
		limit: z.number().int().min(1).max(100).default(25),
	}),
	annotations: { readOnlyHint: true },
	run: async ({ query, limit }, caller) => {
		const settled = await Promise.allSettled(
			(await places(caller.user, caller.owner)).map(async ({ place, open }) => {
				const service = await open();
				const found = await service.searchFiles(query, limit);
				const live = found.list.filter((item) => !item.metadata.isTrashed);
				const names = await service.folderNames(
					live.flatMap((item) => (item.parentKey ? [item.parentKey] : [])),
				);
				return live.map((item) => {
					const chain = item.parentKey
						? item.parentKey
								.split("/")
								.map((_, index, parts) =>
									names.get(parts.slice(0, index + 1).join("/")),
								)
						: [];
					const name = item.metadata.name ?? item.key.replace(/\/$/, "");
					return {
						path: [placePath(place), ...chain, name].join("/"),
						type: item.type,
						...(item.type === "file" ? { size: item.size } : {}),
						modified: item.updatedAt,
					};
				});
			}),
		);
		const hits = settled.flatMap((result) => {
			if (result.status === "rejected") {
				logger.warn("A place could not be searched:", result.reason);
				return [];
			}
			return result.value;
		});
		return json(hits.slice(0, limit));
	},
});
