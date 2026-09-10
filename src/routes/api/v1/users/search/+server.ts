import { Http } from "$lib/server/http";
import { searchUsers } from "$lib/server/openapi/v1/sharings";
import { SharingService } from "$lib/server/services/sharings";

const sharings = new SharingService();

export const GET = searchUsers.handler(async ({ query, user }) => {
	try {
		return Http.Ok(await sharings.searchUsers(query.q, user.id));
	} catch (error) {
		return Http.ServerError("Failed to search users", error);
	}
});
