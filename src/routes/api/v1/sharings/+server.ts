import { Http } from "$lib/server/http";
import {
	createSharing,
	listResourceSharings,
} from "$lib/server/openapi/v1/sharings";
import { SharingService } from "$lib/server/services/sharings";

const sharings = new SharingService();

export const GET = listResourceSharings.handler(async ({ query, user }) => {
	try {
		return Http.Ok(
			await sharings.listForResource(
				user.id,
				query.resourceType,
				query.resourceId,
			),
		);
	} catch (error) {
		return Http.ServerError("Failed to list sharings", error);
	}
});

export const POST = createSharing.handler(async ({ body, user }) => {
	try {
		const shared = await sharings.share({ ownerId: user.id, ...body });
		if (!shared) {
			return Http.NotFound("Resource not found");
		}
		return Http.Ok({ shared });
	} catch (error) {
		return Http.ServerError("Failed to share resource", error);
	}
});
