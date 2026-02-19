import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";
import { Logger } from "$lib/logger";
import { StorageService } from "$lib/server/services/storage";

const logger = new Logger("UPLOAD_DIRECT");

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const itemId = params.item;

	if (!locals.user) {
		logger.debug("UPLOAD_DIRECT", "No user in locals");
		return error(401, "Unauthorized");
	}

	if (!itemId) {
		logger.warn("Missing item ID");
		return json({ message: "Missing item ID" }, { status: 400 });
	}

	logger.debug("Parsing formData...");

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch (err) {
		logger.error(err);
		return json({
			message: "Failed to parse form data",
			error: err instanceof Error ? err.message : "Internal server error",
		});
	}

	const file = formData.get("file") as File | null;
	if (!file) {
		return json({ message: "No file provided" }, { status: 400 });
	}

	const storageService = new StorageService(locals.user);
	const decodedItemName = decodeURIComponent(itemId);

	const exists = await storageService.fileExists(decodedItemName);
	if (!exists) {
		return json({ message: "File not found" }, { status: 400 });
	}

	try {
		await storageService.uploadFileBody(decodedItemName, file);
		return json({ message: "File uploaded successfully." });
	} catch (err) {
		logger.error(err);
		return json({
			message: "Upload error",
			error: err instanceof Error ? err.message : "Internal server error",
		});
	}
};
