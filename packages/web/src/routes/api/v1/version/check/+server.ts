import { Http } from "$lib/server/http";
import { checkVersion } from "$lib/server/openapi/v1/version";
import { checkForUpdate } from "$lib/server/services/version";

export const GET = checkVersion.handler(async () => {
	try {
		const result = await checkForUpdate();
		return Http.Ok(result);
	} catch (error) {
		return Http.ServerError("Failed to check for updates", error);
	}
});
