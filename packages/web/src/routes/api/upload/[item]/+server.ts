import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { Logger } from "$lib/logger";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("UPLOAD_DIRECT");

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const itemId = params.item;

	logger.debug("UPLOAD_DIRECT", "=== Direct upload endpoint hit ===", {
		itemId,
		contentType: request.headers.get("content-type"),
		contentLength: request.headers.get("content-length"),
		bodyUsed: request.bodyUsed,
	});

	if (!locals.user) {
		logger.debug("UPLOAD_DIRECT", "No user in locals");
		return error(401, "Unauthorized");
	}

	if (!itemId) {
		logger.debug("UPLOAD_DIRECT", "No item ID");
		return error(400, "Missing item ID");
	}

	logger.debug("UPLOAD_DIRECT", "About to parse formData...");

	let formData: FormData;
	try {
		formData = await request.formData();
		logger.debug("UPLOAD_DIRECT", "formData parsed successfully!");
	} catch (err) {
		logger.debug("UPLOAD_DIRECT", "formData PARSE ERROR", {
			error: String(err),
			message: err instanceof Error ? err.message : "unknown",
		});
		return error(500, `Failed to parse form data: ${err}`);
	}

	const file = formData.get("file") as File | null;
	if (!file) {
		logger.debug("UPLOAD_DIRECT", "No file in formData");
		return error(400, "No file provided");
	}

	logger.debug("UPLOAD_DIRECT", "File received", {
		name: file.name,
		size: file.size,
		type: file.type,
	});

	const storageService = new StorageService(locals.user);
	const decodedItemName = decodeURIComponent(itemId);

	const exists = await storageService.fileExists(decodedItemName);
	if (!exists) {
		logger.debug("UPLOAD_DIRECT", "File not found", { decodedItemName });
		return error(404, "File not found");
	}

	try {
		logger.debug("UPLOAD_DIRECT", "Uploading file body...");
		await storageService.uploadFileBody(decodedItemName, file);
		logger.debug("UPLOAD_DIRECT", "Upload complete!");
		return json({ message: "File uploaded successfully." });
	} catch (err) {
		logger.debug("UPLOAD_DIRECT", "Upload error", { error: String(err) });
		return error(500, `Upload failed: ${err}`);
	}
};
