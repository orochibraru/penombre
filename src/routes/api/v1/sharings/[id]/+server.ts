import { Http } from "$lib/server/http";
import { revokeSharing } from "$lib/server/openapi/v1/sharings";
import { SharingService } from "$lib/server/services/sharings";

const sharings = new SharingService();

export const DELETE = revokeSharing.handler(async ({ params, user }) => {
	try {
		const revoked = await sharings.revoke(user.id, params.id);
		if (!revoked) {
			return Http.NotFound("Sharing not found");
		}
		return Http.Ok({ revoked });
	} catch (error) {
		return Http.ServerError("Failed to revoke sharing", error);
	}
});
