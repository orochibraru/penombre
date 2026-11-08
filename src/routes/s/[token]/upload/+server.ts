import { error, json } from "@sveltejs/kit";

import { Logger } from "#lib/logger.js";
import { ReadOnlyVolumeError } from "#lib/server/errors.js";
import { isRateLimited } from "#lib/server/rate-limit.js";
import { ShareService, unlockCookieName } from "#lib/server/services/shares.js";
import { shareLinkStorage } from "#lib/server/services/storage-for.js";

const shares = new ShareService();
const logger = new Logger("Share upload");

/**
 * Drop one file into a folder link that allows uploads.
 *
 * Anonymous by design: the token (plus any password or sign-in the link
 * demands) is the whole credential. Files land at the folder's top level and
 * never replace anything: a clashing name gets a suffix.
 */
export const POST = async ({
	params,
	request,
	locals,
	cookies,
	getClientAddress,
}) => {
	// Per IP before the token is looked up, so fake tokens cost nothing.
	if (
		await isRateLimited(`share-upload:ip:${getClientAddress()}`, {
			max: 200,
			windowSeconds: 10 * 60,
		})
	) {
		return error(429, "Too many uploads. Try again later.");
	}

	const { token } = params;
	const result = await shares.access(token, {
		viewer: locals.user ?? null,
		unlock: cookies.get(unlockCookieName(token)) ?? null,
	});
	if (!result.ok) {
		return error(result.reason === "not-found" ? 404 : 403, "No access.");
	}
	const { share } = result;
	if (share.resourceType !== "folder" || !share.allowUploads) {
		return error(403, "This link does not accept uploads.");
	}

	const service = await shareLinkStorage(share);
	if (!service) {
		return error(404, "The shared folder is no longer available.");
	}
	const folderPath = await service
		.getFolder(share.resourceId)
		.catch(() => null);
	const folderMeta = folderPath
		? await service.getFolderMeta(folderPath)
		: null;
	if (!folderPath || !folderMeta || folderMeta.isTrashed) {
		return error(404, "The shared folder is no longer available.");
	}

	let file: File | null;
	try {
		const value = (await request.formData()).get("file");
		file = value instanceof File ? value : null;
	} catch {
		file = null;
	}
	if (!file?.name) {
		return error(400, "No file provided.");
	}

	let created: { id?: string; finalName: string };
	try {
		created = await service.createFile(
			{ name: file.name, size: file.size },
			folderPath,
		);
	} catch (cause) {
		if (cause instanceof ReadOnlyVolumeError) {
			return error(403, "This folder is read-only.");
		}
		logger.error(`Could not create an upload under share ${share.id}`, cause);
		return error(500, "Upload failed.");
	}
	if (!created.id) {
		return error(500, "Upload failed.");
	}

	try {
		await service.uploadFileBody(created.id, file, {
			snapshot: false,
			modifiedAt: file.lastModified ? new Date(file.lastModified) : undefined,
		});
	} catch (cause) {
		logger.error(`Upload body failed under share ${share.id}`, cause);
		// An empty row would list as a file that opens as nothing.
		const path = await service.findFileById(created.id);
		if (path) {
			await service.deleteFile(path).catch(() => undefined);
		}
		return error(500, "Upload failed.");
	}

	return json({ name: created.finalName });
};
