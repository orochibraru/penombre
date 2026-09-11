import { Http } from "$lib/server/http";
import { createShare, listShares } from "$lib/server/openapi/v1/shares";
import { ShareService } from "$lib/server/services/shares";
import { toShareDto } from "$lib/server/services/shares.dto";

const shares = new ShareService();

export const GET = listShares.handler(async ({ user }) => {
	try {
		return Http.Ok((await shares.list(user.id)).map(toShareDto));
	} catch (error) {
		return Http.ServerError("Failed to list share links", error);
	}
});

export const POST = createShare.handler(async ({ body, user }) => {
	try {
		const share = await shares.create({ ownerId: user.id, ...body });
		if (!share) {
			return Http.NotFound("Resource not found");
		}
		return Http.Ok(toShareDto(share));
	} catch (error) {
		return Http.ServerError("Failed to create share link", error);
	}
});
