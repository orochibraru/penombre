import { error } from "@sveltejs/kit";
import type { Share } from "#lib/server/db/schema.js";
import { exportFile } from "#lib/server/office/export/index.js";
import { ShareService, unlockCookieName } from "#lib/server/services/shares.js";
import type { StorageService } from "#lib/server/services/storage/index.js";
import {
	isActiveContentType,
	parseRange,
	rawFileSecurityHeaders,
} from "#lib/server/services/storage/mappers.js";
import { shareLinkStorage } from "#lib/server/services/storage-for.js";

const shares = new ShareService();

/** A zip of the whole shared folder. */
async function folderZip(service: StorageService, share: Share) {
	const folderPath = await service.getFolder(share.resourceId);
	const stream = await service.createZipFromFolder(folderPath);
	return new Response(stream, {
		headers: {
			"Content-Type": "application/zip",
			"Content-Disposition": `attachment; filename="${encodeURIComponent(share.resourceName)}.zip"`,
			"Cache-Control": "no-store",
		},
	});
}

/**
 * One file's bytes, or null when it has gone missing since the share.
 *
 * `inline` serves the file for display in the page instead of saving it, and
 * honours Range requests — without 206 support a browser cannot seek within a
 * video or audio file, it can only replay from the start.
 */
async function fileBody(
	service: StorageService,
	share: Share,
	fileId: string,
	options: { inline: boolean; range: string | null },
): Promise<Response | null> {
	const path = await service.findFileById(fileId);
	const raw = path ? await service.openRawFile(path) : null;
	if (!raw || raw.meta.metadata.isTrashed) {
		return null;
	}

	const contentType =
		raw.meta.metadata.contentType ?? "application/octet-stream";
	const filename = encodeURIComponent(
		raw.meta.metadata.name ?? share.resourceName,
	);
	const { size } = raw;

	// Active types are always downloaded, never rendered inline, whatever the
	// caller asked for; an HTML or SVG file must not run script on the
	// instance origin with the visitor's (or nobody's) session.
	const inline = options.inline && !isActiveContentType(contentType);
	const disposition = inline
		? `inline; filename="${filename}"`
		: `attachment; filename="${filename}"`;

	if (inline) {
		const range = parseRange(options.range, size);
		if (range) {
			return new Response(await raw.stream(range.start, range.end), {
				status: 206,
				headers: {
					"Content-Type": contentType,
					"Content-Disposition": disposition,
					"Content-Range": `bytes ${range.start}-${range.end}/${size}`,
					"Content-Length": String(range.end - range.start + 1),
					"Accept-Ranges": "bytes",
					"Cache-Control": "no-store",
					...rawFileSecurityHeaders(contentType),
				},
			});
		}
	}

	return new Response(await raw.stream(), {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": disposition,
			"Content-Length": String(size),
			...(inline ? { "Accept-Ranges": "bytes" } : {}),
			"Cache-Control": "no-store",
			...rawFileSecurityHeaders(contentType),
		},
	});
}

/**
 * The file converted, as its editor's Download as does: a document, sheet
 * or presentation as a PDF. Null when it cannot be.
 */
async function converted(
	service: StorageService,
	fileId: string,
	format: string,
): Promise<Response | null> {
	const path = await service.findFileById(fileId);
	const raw = path ? await service.getRawFileData(path) : null;
	if (!raw || raw.meta.metadata.isTrashed || format !== "pdf") {
		return null;
	}
	const exported = await exportFile(
		raw.meta.metadata.name ?? "download",
		raw.buffer,
		"pdf",
	).catch(() => null);
	if (!exported) {
		return null;
	}
	return new Response(new Uint8Array(exported.data), {
		headers: {
			"Content-Type": exported.contentType,
			"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(exported.filename)}`,
			"Cache-Control": "no-store",
			...rawFileSecurityHeaders(exported.contentType),
		},
	});
}

/** Whether this share may serve `fileId`. */
function mayServe(share: Share, fileId: string): Promise<boolean> {
	if (share.resourceType === "folder") {
		// A folder share must not become a read-anything capability: the id
		// comes from the query string, so prove it is under the shared folder.
		return shares.fileIsInFolder(share.resourceId, fileId);
	}
	// A file share is a link to exactly one file.
	return Promise.resolve(fileId === share.resourceId);
}

/**
 * Download the shared resource.
 *
 * A file share serves its bytes. A folder share serves a zip, or one file
 * from inside it when `?file=<id>` is given.
 *
 * Access is re-checked here rather than trusted from the page that linked in:
 * this URL is guessable from the page URL, so it is the real gate.
 */
export const GET = async ({ params, url, locals, cookies, request }) => {
	const { token } = params;
	const result = await shares.access(token, {
		viewer: locals.user ?? null,
		unlock: cookies.get(unlockCookieName(token)) ?? null,
	});

	if (!result.ok) {
		return error(result.reason === "not-found" ? 404 : 403, "No access.");
	}

	const { share } = result;
	const service = await shareLinkStorage(share);
	if (!service) {
		return error(404, "File not found.");
	}
	const requestedFile = url.searchParams.get("file");
	const inline = url.searchParams.has("inline");

	if (share.resourceType === "folder" && !requestedFile) {
		await shares.recordDownload(share.id);
		return folderZip(service, share);
	}

	const fileId = requestedFile ?? share.resourceId;
	if (!(await mayServe(share, fileId))) {
		return error(403, "No access.");
	}

	const format = url.searchParams.get("format");
	const body = format
		? await converted(service, fileId, format)
		: await fileBody(service, share, fileId, {
				inline,
				range: request.headers.get("range"),
			});
	if (!body) {
		return error(404, "File not found.");
	}

	// Playing a preview is not a download, and a video that seeks would
	// otherwise count dozens of them against the share's tally.
	if (!inline) {
		await shares.recordDownload(share.id);
	}
	return body;
};
