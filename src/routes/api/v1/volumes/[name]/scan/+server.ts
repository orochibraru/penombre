import { getVolume } from "#lib/server/config.js";
import { Http } from "#lib/server/http.js";
import { rescanVolume } from "#lib/server/openapi/v1/volumes.js";
import { scanNow, volumeScanKey } from "#lib/server/services/library-scan.js";
import { volumeStorage } from "#lib/server/services/storage-for.js";

export const POST = rescanVolume.handler(async ({ params, body, user }) => {
	const volume = getVolume(params.name);
	if (!volume) {
		return Http.NotFound("No such volume");
	}
	const service = await volumeStorage(volume, user);
	const started = scanNow(volumeScanKey(volume.name), (report) =>
		service.scanStorage(report, { full: body.mode === "full" }),
	);
	return Http.Ok({ started });
});
