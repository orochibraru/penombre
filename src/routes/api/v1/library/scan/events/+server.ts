import { isSimpleMode } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { libraryScanEvents } from "#lib/server/openapi/v1/volumes.js";
import { scanEventStream } from "#lib/server/scan-events.js";
import { LIBRARY_SCAN_KEY } from "#lib/server/services/library-scan.js";

export const GET = libraryScanEvents.handler(({ event }) => {
	if (!isSimpleMode()) {
		return Http.NotFound("No library to scan");
	}
	return scanEventStream(LIBRARY_SCAN_KEY, event.request);
});
