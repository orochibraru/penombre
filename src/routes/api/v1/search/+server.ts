import { Http } from "#lib/server/http.js";
import { searchEverywhere } from "#lib/server/openapi/v1/storage.js";
import { searchEverywhere as search } from "#lib/server/services/search.js";

export const GET = searchEverywhere.handler(async ({ query, user, event }) => {
	try {
		return Http.Ok(
			await search(
				user,
				event.locals.storageOwner ?? user,
				query.q,
				query.limit,
			),
		);
	} catch (error) {
		return Http.ServerError("Failed to search", error);
	}
});
