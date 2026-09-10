import { Readable } from "node:stream";
import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import type { Share } from "$lib/server/db/schema";
import { ShareService, unlockCookieName } from "$lib/server/services/shares";
import { StorageService } from "$lib/server/services/storage";

const shares = new ShareService();

/** A zip of the whole shared folder. */
async function folderZip(service: StorageService, share: Share) {
	const folderPath = await service.getFolder(share.resourceId);
	const { stream } = await service.createZipFromFolder(folderPath);
	return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
		headers: {
			"Content-Type": "application/zip",
			"Content-Disposition": `attachment; filename="${encodeURIComponent(share.resourceName)}.zip"`,
			"Cache-Control": "no-store",
		},
	});
}

/** One file's bytes, or null when it has gone missing since the share. */
async function fileBody(
	service: StorageService,
	share: Share,
	fileId: string,
): Promise<Response | null> {
	const path = await service.findFileById(fileId);
	const raw = path ? await service.getRawFileData(path) : null;
	if (!raw) {
		return null;
	}
	return new Response(raw.buffer, {
		headers: {
			"Content-Type":
				raw.meta.metadata.contentType ?? "application/octet-stream",
			"Content-Disposition": `attachment; filename="${encodeURIComponent(raw.meta.metadata.name ?? share.resourceName)}"`,
			// The buffer is the truth: `raw.size` is the database's copy, and a
			// stale row would send a Content-Length that truncates the body.
			"Content-Length": String(raw.buffer.byteLength),
			"Cache-Control": "no-store",
		},
	});
}

/** Whether this share may serve `fileId`. */
function mayServe(share: Share, fileId: string): Promise<boolean> {
	if (share.resourceType === "folder") {
		// A folder share must not become a read-anything capability: the id
		// comes from the query string, so prove it is under the shared folder.
		return shares.fileIsInFolder(share.ownerId, share.resourceId, fileId);
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
export const GET = async ({ params, url, locals, cookies }) => {
	const { token } = params;
	const result = await shares.access(token, {
		viewer: locals.user ?? null,
		unlock: cookies.get(unlockCookieName(token)) ?? null,
	});

	if (!result.ok) {
		return error(result.reason === "not-found" ? 404 : 403, "No access.");
	}

	const { share } = result;
	const service = new StorageService({ id: share.ownerId } as User);
	const requestedFile = url.searchParams.get("file");

	if (share.resourceType === "folder" && !requestedFile) {
		await shares.recordDownload(share.id);
		return folderZip(service, share);
	}

	const fileId = requestedFile ?? share.resourceId;
	if (!(await mayServe(share, fileId))) {
		return error(403, "No access.");
	}

	const body = await fileBody(service, share, fileId);
	if (!body) {
		return error(404, "File not found.");
	}

	await shares.recordDownload(share.id);
	return body;
};
