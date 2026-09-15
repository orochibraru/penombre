import { Http } from "$lib/server/http";
import { emptyTrash } from "$lib/server/openapi/v1/storage";

export const DELETE = emptyTrash.handler(async ({ service }) => {
	try {
		return Http.Ok(await service.emptyTrash());
	} catch (error) {
		return Http.ServerError("Failed to empty the trash", error);
	}
});
