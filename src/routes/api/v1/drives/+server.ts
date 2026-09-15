import { Http } from "$lib/server/http";
import { createDrive, listDrives } from "$lib/server/openapi/v1/drives";
import { drivesService, rethrowRefusal } from "$lib/server/services/drives";

export const GET = listDrives.handler(async ({ user }) => {
	try {
		return Http.Ok(await drivesService.listForUser(user.id));
	} catch (error) {
		rethrowRefusal(error);
		return Http.ServerError("Failed to list drives", error);
	}
});

export const POST = createDrive.handler(async ({ body, user }) => {
	try {
		return Http.Ok(await drivesService.create(user.id, body.name.trim()));
	} catch (error) {
		rethrowRefusal(error);
		return Http.ServerError("Failed to create drive", error);
	}
});
