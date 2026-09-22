import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import { SharingService } from "#lib/server/services/sharings.js";
import { StorageService } from "#lib/server/services/storage/index.js";
import {
	parseRange,
	rawFileSecurityHeaders,
} from "#lib/server/services/storage/mappers.js";

const sharings = new SharingService();

/**
 * Serve a resource someone shared with the caller.
 *
 * The bytes belong to the owner, so the storage service runs as them — but
 * only after `resolveAccess` proves this `sharedWith` row is the caller's.
 */
export const GET = async ({ params, locals, request }) => {
	if (!locals.user) {
		return error(401, "Sign in to open this.");
	}

	const access = await sharings.resolveAccess(locals.user.id, params.id);
	if (!access) {
		return error(404, "Not shared with you.");
	}

	const service = new StorageService({ id: access.ownerId } as User);

	if (access.resourceType === "folder") {
		const folderPath = await service.getFolder(access.resourceId);
		const stream = await service.createZipFromFolder(folderPath);
		return new Response(stream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": "attachment",
				"Cache-Control": "no-store",
			},
		});
	}

	const path = await service.findFileById(access.resourceId);
	const raw = path ? await service.openRawFile(path) : null;
	if (!raw || raw.meta.metadata.isTrashed) {
		return error(404, "File not found.");
	}

	const contentType =
		raw.meta.metadata.contentType ?? "application/octet-stream";
	const headers = {
		"Content-Type": contentType,
		"Content-Disposition": `attachment; filename="${encodeURIComponent(raw.meta.metadata.name ?? "download")}"`,
		"Accept-Ranges": "bytes",
		"Cache-Control": "no-store",
		...rawFileSecurityHeaders(contentType),
	};
	const range = parseRange(request.headers.get("range"), raw.size);
	if (range) {
		return new Response(await raw.stream(range.start, range.end), {
			status: 206,
			headers: {
				...headers,
				"Content-Range": `bytes ${range.start}-${range.end}/${raw.size}`,
				"Content-Length": String(range.end - range.start + 1),
			},
		});
	}
	return new Response(await raw.stream(), {
		headers: { ...headers, "Content-Length": String(raw.size) },
	});
};
