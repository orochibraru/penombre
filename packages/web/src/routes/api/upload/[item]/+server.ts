import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { debugLog } from "$lib/server/debug-log";
import { StorageService } from "$lib/server/services/storage";

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const itemId = params.item;

	debugLog("UPLOAD_DIRECT", "=== Direct upload endpoint hit ===", {
		itemId,
		contentType: request.headers.get("content-type"),
		contentLength: request.headers.get("content-length"),
		bodyUsed: request.bodyUsed,
	});

	if (!locals.user) {
		debugLog("UPLOAD_DIRECT", "No user in locals");
		return error(401, "Unauthorized");
	}

	if (!itemId) {
		debugLog("UPLOAD_DIRECT", "No item ID");
		return error(400, "Missing item ID");
	}

	debugLog("UPLOAD_DIRECT", "About to parse formData...");

	let formData: FormData;
	try {
		formData = await request.formData();
		debugLog("UPLOAD_DIRECT", "formData parsed successfully!");
	} catch (err) {
		debugLog("UPLOAD_DIRECT", "formData PARSE ERROR", {
			error: String(err),
			message: err instanceof Error ? err.message : "unknown",
		});
		return error(500, `Failed to parse form data: ${err}`);
	}

	const file = formData.get("file") as File | null;
	if (!file) {
		debugLog("UPLOAD_DIRECT", "No file in formData");
		return error(400, "No file provided");
	}

	debugLog("UPLOAD_DIRECT", "File received", {
		name: file.name,
		size: file.size,
		type: file.type,
	});

	const storageService = new StorageService(locals.user);
	const decodedItemName = decodeURIComponent(itemId);

	const exists = await storageService.fileExists(decodedItemName);
	if (!exists) {
		debugLog("UPLOAD_DIRECT", "File not found", { decodedItemName });
		return error(404, "File not found");
	}

	try {
		debugLog("UPLOAD_DIRECT", "Uploading file body...");
		await storageService.uploadFileBody(decodedItemName, file);
		debugLog("UPLOAD_DIRECT", "Upload complete!");
		return json({ message: "File uploaded successfully." });
	} catch (err) {
		debugLog("UPLOAD_DIRECT", "Upload error", { error: String(err) });
		return error(500, `Upload failed: ${err}`);
	}
};
