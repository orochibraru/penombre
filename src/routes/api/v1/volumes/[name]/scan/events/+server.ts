import { getVolume } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { volumeScanEvents } from "#lib/server/openapi/v1/volumes.js";
import { scanEventStream } from "#lib/server/scan-events.js";
import { volumeScanKey } from "#lib/server/services/library-scan.js";

export const GET = volumeScanEvents.handler(({ params, event }) => {
	const volume = getVolume(params.name);
	if (!volume) {
		return Http.NotFound("No such volume");
	}
	return scanEventStream(volumeScanKey(volume.name), event.request);
});
