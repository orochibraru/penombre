import { Http } from "$lib/server/http";
import { removeDriveMember } from "$lib/server/openapi/v1/drives";
import { drivesService, rethrowRefusal } from "$lib/server/services/drives";

export const DELETE = removeDriveMember.handler(async ({ params, user }) => {
	try {
		await drivesService.removeMember(params.id, user.id, params.userId);
		return Http.Ok({ message: "Member removed" });
	} catch (error) {
		rethrowRefusal(error);
		return Http.ServerError("Failed to remove member", error);
	}
});
