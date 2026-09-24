import { isSimpleMode } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { rescanLibrary } from "#lib/server/openapi/v1/volumes.js";
import {
	LIBRARY_SCAN_KEY,
	loadSharedOwner,
	scanNow,
} from "#lib/server/services/library-scan.js";
import { StorageService } from "#lib/server/services/storage/index.js";

export const POST = rescanLibrary.handler(async ({ body }) => {
	const owner = isSimpleMode() ? await loadSharedOwner() : undefined;
	if (!owner) {
		return Http.NotFound("No library to scan");
	}
	const service = new StorageService(owner);
	const started = scanNow(LIBRARY_SCAN_KEY, (report) =>
		service.scanStorage(report, { full: body.mode === "full" }),
	);
	return Http.Ok({ started });
});
