import { Http } from "#lib/server/http.js";
import { deleteDrive, renameDrive } from "#lib/server/openapi/v1/drives.js";
import { drivesService, rethrowRefusal } from "#lib/server/services/drives.js";

export const PUT = renameDrive.handler(async ({ params, body, user }) => {
	try {
		await drivesService.rename(params.id, user.id, body.name.trim());
		return Http.Ok({ message: "Drive renamed" });
	} catch (error) {
		rethrowRefusal(error);
		return Http.ServerError("Failed to rename drive", error);
	}
});

export const DELETE = deleteDrive.handler(async ({ params, user }) => {
	try {
		await drivesService.remove(params.id, user.id);
		return Http.Ok({ message: "Drive deleted" });
	} catch (error) {
		rethrowRefusal(error);
		return Http.ServerError("Failed to delete drive", error);
	}
});
