import { Http } from "#lib/server/http.js";
import { revokeShare } from "#lib/server/openapi/v1/shares.js";
import { ShareService } from "#lib/server/services/shares.js";

const shares = new ShareService();

export const DELETE = revokeShare.handler(async ({ params, user }) => {
	try {
		const revoked = await shares.revoke(user.id, params.id);
		if (!revoked) {
			return Http.NotFound("Share link not found");
		}
		return Http.Ok({ revoked });
	} catch (error) {
		return Http.ServerError("Failed to revoke share link", error);
	}
});
