import { Logger } from "#lib/logger.js";
import {
	DriveAccessError,
	FileOrFolderNotFoundError,
	ReadOnlyVolumeError,
	StorageUnavailableError,
} from "#lib/server/errors.js";
import {
	encodeXml,
	isElement,
	parseXml,
	type XmlElement,
} from "#lib/server/office/xml.js";
import type { StorageService } from "#lib/server/services/storage/index.js";
import type { TreeEntry } from "#lib/server/services/storage/listings.js";
import { type DavLocation, hrefFor, parseDavPath } from "./location";
import { multistatus, propResponse, xmlResponse } from "./multistatus";

const logger = new Logger("WebDAV");

export type DavService = Pick<
	StorageService,
	| "treeEntries"
	| "treeEntry"
	| "treeEntryById"
	| "handleRawFile"
	| "createFile"
	| "uploadFileBody"
	| "deleteFile"
	| "updateFile"
	| "trashFolder"
	| "createFolder"
	| "deleteFolder"
	| "moveFile"
	| "moveFolder"
	| "updateFolderMeta"
	| "replaceFile"
>;

const ALLOW =
	"OPTIONS, PROPFIND, PROPPATCH, GET, HEAD, PUT, DELETE, MKCOL, MOVE, LOCK, UNLOCK";

const ROOT: TreeEntry = {
	type: "folder",
	id: "",
	name: "",
	path: "",
	size: 0,
	updatedAt: new Date(0),
	contentType: "httpd/unix-directory",
};

function status(code: number, headers?: Record<string, string>): Response {
	return new Response(null, { status: code, headers });
}

async function resolve(
	service: DavService,
	segments: string[],
): Promise<TreeEntry | null> {
	let entry = ROOT;
	for (const segment of segments) {
		if (entry.type !== "folder") {
			return null;
		}
		const next = await service.treeEntry(entry.path, segment);
		if (!next) {
			return null;
		}
		entry = next;
	}
	return entry;
}

function failure(error: unknown): Response {
	if (error instanceof FileOrFolderNotFoundError) {
		return status(404);
	}
	if (error instanceof ReadOnlyVolumeError) {
		return status(403);
	}
	if (error instanceof DriveAccessError) {
		return status(error.status);
	}
	if (error instanceof StorageUnavailableError) {
		return status(503);
	}
	logger.error("WebDAV request failed", error);
	return status(500);
}

export function davOptions(): Response {
	return status(200, { dav: "1, 2", allow: ALLOW, "ms-author-via": "DAV" });
}

async function propfind(
	request: Request,
	service: DavService,
	loc: DavLocation,
): Promise<Response> {
	const depth = request.headers.get("depth");
	if (depth === "infinity") {
		return xmlResponse(
			403,
			'<d:error xmlns:d="DAV:"><d:propfind-finite-depth/></d:error>',
		);
	}
	if (isOsJunk(loc.segments.at(-1))) {
		return status(404);
	}
	const entry = await resolve(service, loc.segments);
	if (!entry) {
		return status(404);
	}
	const folder = entry.type === "folder";
	const parts = [propResponse(hrefFor(loc.base, loc.segments, folder), entry)];
	if (depth !== "0" && folder) {
		for (const child of (await service.treeEntries(entry.path)) ?? []) {
			const href = hrefFor(
				loc.base,
				[...loc.segments, child.name],
				child.type === "folder",
			);
			parts.push(propResponse(href, child));
		}
	}
	return multistatus(parts);
}

async function get(
	request: Request,
	service: DavService,
	loc: DavLocation,
): Promise<Response> {
	if (isOsJunk(loc.segments.at(-1))) {
		return status(404);
	}
	const entry = await resolve(service, loc.segments);
	if (!entry) {
		return status(404);
	}
	if (entry.type === "folder") {
		return status(405, { allow: ALLOW });
	}
	const res = await service.handleRawFile(
		entry.path,
		request.headers.get("if-none-match") ?? undefined,
		request.headers.get("range") ?? undefined,
	);
	if (request.method !== "HEAD") {
		return res;
	}
	await res.body?.cancel();
	return new Response(null, { status: res.status, headers: res.headers });
}

const OS_JUNK = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

/** Finder and Explorer litter every folder they touch. */
function isOsJunk(name: string | undefined): boolean {
	return !!name && (OS_JUNK.has(name) || name.startsWith("._"));
}

function split(segments: string[]): [string[], string] {
	return [segments.slice(0, -1), segments.at(-1) ?? ""];
}

async function trash(service: DavService, entry: TreeEntry): Promise<void> {
	await (entry.type === "file"
		? service.updateFile(entry.path, { isTrashed: true })
		: service.trashFolder(entry.path));
}

function mtimeOf(request: Request): Date | undefined {
	const seconds = Number(request.headers.get("x-oc-mtime"));
	return Number.isFinite(seconds) && seconds > 0
		? new Date(seconds * 1000)
		: undefined;
}

async function put(
	request: Request,
	service: DavService,
	loc: DavLocation,
): Promise<Response> {
	const [parentSegments, name] = split(loc.segments);
	if (!name) {
		return status(405, { allow: ALLOW });
	}
	if (isOsJunk(name)) {
		await request.body?.cancel();
		return status(201);
	}
	const parent = await resolve(service, parentSegments);
	if (parent?.type !== "folder") {
		return status(409);
	}
	// ponytail: whole body in memory, as the upload route does; stream when a multi-GB PUT matters
	const bytes = new Uint8Array(await request.arrayBuffer());
	const modifiedAt = mtimeOf(request);
	const accepted = { "x-oc-mtime": "accepted" };

	const existing = await service.treeEntry(parent.path, name);
	if (existing?.type === "folder") {
		return status(405, { allow: ALLOW });
	}
	if (existing) {
		await service.uploadFileBody(existing.id, bytes, {
			snapshot: true,
			modifiedAt,
		});
		return status(204, accepted);
	}

	const created = await service.createFile(
		{ name, size: bytes.byteLength },
		parent.path || undefined,
	);
	// SQLite's lower() is ASCII-only; the JS dedupe is not.
	if (created.metadata.name !== name || !created.id) {
		await service.deleteFile(created.finalName);
		return status(409);
	}
	await service.uploadFileBody(created.id, bytes, {
		snapshot: false,
		modifiedAt,
	});
	return status(201, accepted);
}

async function mkcol(
	request: Request,
	service: DavService,
	loc: DavLocation,
): Promise<Response> {
	if ((await request.text()).length > 0) {
		return status(415);
	}
	const [parentSegments, name] = split(loc.segments);
	if (!name) {
		return status(405, { allow: ALLOW });
	}
	const parent = await resolve(service, parentSegments);
	if (parent?.type !== "folder") {
		return status(409);
	}
	if (await service.treeEntry(parent.path, name)) {
		return status(405, { allow: ALLOW });
	}
	const created = await service.createFolder(name, parent.path || undefined);
	if (created.name !== name) {
		await service.deleteFolder(created.path);
		return status(409);
	}
	return status(201);
}

const SAVE_WINDOW_MS = 60_000;

/**
 * Office saves by renaming the original away, moving its temp file onto the
 * freed name, then deleting the backup. Recorded per row id, per process.
 */
export interface SaveMemo {
	/** A file's name before a MOVE took it away. */
	vacated: Map<string, { parent: string; name: string; until: number }>;
	/** Files that arrived at a free name by MOVE. */
	arrived: Map<string, number>;
}

export function newSaveMemo(): SaveMemo {
	return { vacated: new Map(), arrived: new Map() };
}

const sharedMemo = newSaveMemo();

function remember(
	memo: SaveMemo,
	id: string,
	from: { parent: string; name: string },
	now = Date.now(),
): void {
	for (const [id, entry] of memo.vacated) {
		if (entry.until < now) {
			memo.vacated.delete(id);
		}
	}
	for (const [id, until] of memo.arrived) {
		if (until < now) {
			memo.arrived.delete(id);
		}
	}
	const until = now + SAVE_WINDOW_MS;
	memo.vacated.set(id, { ...from, until });
	memo.arrived.set(id, until);
}

async function relocate(
	service: DavService,
	entry: TreeEntry,
	parent: string,
	name: string,
): Promise<void> {
	if (parentPath(entry.path) !== parent) {
		await (entry.type === "file"
			? service.moveFile(entry.path, parent)
			: service.moveFolder(entry.path, parent));
	}
	const moved = await service.treeEntryById(entry.type, entry.id);
	if (!moved) {
		throw new Error("A moved item vanished");
	}
	if (moved.name !== name) {
		await (moved.type === "file"
			? service.updateFile(moved.path, { key: name })
			: service.updateFolderMeta(moved.path, { name }));
	}
}

/** The backup of a safe save takes the new bytes back under its old name. */
async function restoreSaved(
	service: DavService,
	backup: TreeEntry,
	memo: SaveMemo,
): Promise<boolean> {
	const now = Date.now();
	const from = memo.vacated.get(backup.id);
	if (backup.type !== "file" || !from || from.until < now) {
		return false;
	}
	const saved = await service.treeEntry(from.parent, from.name);
	const arrived = saved ? memo.arrived.get(saved.id) : undefined;
	if (
		!saved ||
		saved.type !== "file" ||
		saved.id === backup.id ||
		!arrived ||
		arrived < now
	) {
		return false;
	}
	if (!(await service.replaceFile(backup.id, saved.id))) {
		return false;
	}
	memo.vacated.delete(backup.id);
	memo.arrived.delete(saved.id);
	await relocate(service, backup, from.parent, from.name);
	return true;
}

async function remove(
	service: DavService,
	loc: DavLocation,
	memo: SaveMemo,
): Promise<Response> {
	if (loc.segments.length === 0) {
		return status(403);
	}
	if (isOsJunk(loc.segments.at(-1))) {
		return status(204);
	}
	const entry = await resolve(service, loc.segments);
	if (!entry) {
		return status(404);
	}
	if (!(await restoreSaved(service, entry, memo))) {
		await trash(service, entry);
	}
	return status(204);
}

function parentPath(path: string): string {
	return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

function within(inner: string[], outer: string[]): boolean {
	return (
		inner.length > outer.length &&
		outer.every((s, i) => s.toLowerCase() === inner[i]?.toLowerCase())
	);
}

/** Where a MOVE goes, or the refusal. */
function destinationOf(
	request: Request,
	loc: DavLocation,
): DavLocation | Response {
	const header = request.headers.get("destination");
	if (!header) {
		return status(400);
	}
	let target: URL;
	try {
		target = new URL(header, request.url);
	} catch {
		return status(400);
	}
	const dest = parseDavPath(target.pathname);
	if (!dest) {
		return status(400);
	}
	// Path only: with ORIGIN set every request reads as one host, whatever
	// name or scheme the client used.
	if (dest.base !== loc.base) {
		return status(502);
	}
	if (
		loc.segments.length === 0 ||
		dest.segments.length === 0 ||
		within(dest.segments, loc.segments)
	) {
		return status(403);
	}
	return dest;
}

async function move(
	request: Request,
	service: DavService,
	loc: DavLocation,
	memo: SaveMemo,
): Promise<Response> {
	const dest = destinationOf(request, loc);
	if (dest instanceof Response) {
		return dest;
	}

	const source = await resolve(service, loc.segments);
	if (!source) {
		return status(404);
	}
	const [destParentSegments, destName] = split(dest.segments);
	const destParent = await resolve(service, destParentSegments);
	if (destParent?.type !== "folder") {
		return status(409);
	}

	const existing = await service.treeEntry(destParent.path, destName);
	const replaces = !!existing && existing.id !== source.id;
	if (replaces && existing) {
		if (request.headers.get("overwrite")?.toUpperCase() === "F") {
			return status(412);
		}
		if (existing.type === "file" && source.type === "file") {
			return (await service.replaceFile(existing.id, source.id))
				? status(204)
				: status(409);
		}
		await trash(service, existing);
	}

	const from = { parent: parentPath(source.path), name: source.name };
	await relocate(service, source, destParent.path, destName);
	if (source.type === "file" && !replaces) {
		remember(memo, source.id, from);
	}
	return status(replaces ? 204 : 201);
}

/** Advisory: Finder and Explorer only write where LOCK answers. Nothing is enforced. */
function lock(loc: DavLocation): Response {
	const token = `opaquelocktoken:${crypto.randomUUID()}`;
	const href = encodeXml(hrefFor(loc.base, loc.segments, false));
	return xmlResponse(
		200,
		`<d:prop xmlns:d="DAV:"><d:lockdiscovery><d:activelock><d:locktype><d:write/></d:locktype><d:lockscope><d:exclusive/></d:lockscope><d:depth>0</d:depth><d:timeout>Second-3600</d:timeout><d:locktoken><d:href>${token}</d:href></d:locktoken><d:lockroot><d:href>${href}</d:href></d:lockroot></d:activelock></d:lockdiscovery></d:prop>`,
		{ "lock-token": `<${token}>` },
	);
}

const localName = (name: string) => name.slice(name.indexOf(":") + 1);

function propNames(element: XmlElement): string[] {
	return element.children
		.filter(isElement)
		.flatMap((child) =>
			localName(child.name) === "prop"
				? child.children.filter(isElement).map((prop) => prop.name)
				: propNames(child),
		);
}

/** Explorer sets Win32 times after every PUT and gives up on an error. Stored nowhere. */
async function proppatch(
	request: Request,
	loc: DavLocation,
): Promise<Response> {
	let root: XmlElement;
	try {
		root = parseXml(await request.text()).root;
	} catch {
		return status(400);
	}
	const namespaces = Object.entries(root.attrs)
		.filter(
			([key, value]) =>
				key.startsWith("xmlns") && key !== "xmlns:d" && value !== undefined,
		)
		.map(
			([key, value]) =>
				` ${key}="${encodeXml(value ?? "").replace(/"/g, "&quot;")}"`,
		)
		.join("");
	const props = propNames(root)
		.map((name) => `<${name}/>`)
		.join("");
	const href = encodeXml(hrefFor(loc.base, loc.segments, false));
	return multistatus(
		[
			`<d:response><d:href>${href}</d:href><d:propstat><d:prop>${props}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`,
		],
		namespaces,
	);
}

export async function handleDav(
	request: Request,
	service: DavService,
	loc: DavLocation,
	memo: SaveMemo = sharedMemo,
): Promise<Response> {
	try {
		switch (request.method) {
			case "OPTIONS":
				return davOptions();
			case "PROPFIND":
				return await propfind(request, service, loc);
			case "GET":
			case "HEAD":
				return await get(request, service, loc);
			case "PUT":
				return await put(request, service, loc);
			case "MKCOL":
				return await mkcol(request, service, loc);
			case "DELETE":
				return await remove(service, loc, memo);
			case "MOVE":
				return await move(request, service, loc, memo);
			case "LOCK":
				await request.body?.cancel();
				return lock(loc);
			case "UNLOCK":
				return status(204);
			case "PROPPATCH":
				return await proppatch(request, loc);
			default:
				return status(405, { allow: ALLOW });
		}
	} catch (error) {
		return failure(error);
	}
}
