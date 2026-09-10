import { Readable } from "node:stream";
import { error } from "@sveltejs/kit";
import type { User } from "better-auth";
import { SharingService } from "$lib/server/services/sharings";
import { StorageService } from "$lib/server/services/storage";

const sharings = new SharingService();

/**
 * Serve a resource someone shared with the caller.
 *
 * The bytes belong to the owner, so the storage service runs as them — but
 * only after `resolveAccess` proves this `sharedWith` row is the caller's.
 */
export const GET = async ({ params, locals }) => {
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
		const { stream } = await service.createZipFromFolder(folderPath);
		return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": "attachment",
				"Cache-Control": "no-store",
			},
		});
	}

	const path = await service.findFileById(access.resourceId);
	const raw = path ? await service.getRawFileData(path) : null;
	if (!raw) {
		return error(404, "File not found.");
	}

	return new Response(raw.buffer, {
		headers: {
			"Content-Type":
				raw.meta.metadata.contentType ?? "application/octet-stream",
			"Content-Disposition": `attachment; filename="${encodeURIComponent(raw.meta.metadata.name ?? "download")}"`,
			"Content-Length": String(raw.buffer.byteLength),
			"Cache-Control": "no-store",
		},
	});
};
