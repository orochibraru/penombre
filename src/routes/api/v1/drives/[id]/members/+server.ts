import { Http } from "#lib/server/http.js";
import {
	addDriveMembers,
	listDriveMembers,
} from "#lib/server/openapi/v1/drives.js";
import { drivesService, rethrowRefusal } from "#lib/server/services/drives.js";
import { NotificationService } from "#lib/server/services/notifications.js";

const notifications = new NotificationService();

export const GET = listDriveMembers.handler(async ({ params, user }) => {
	try {
		return Http.Ok(await drivesService.members(params.id, user.id));
	} catch (error) {
		rethrowRefusal(error);
		return Http.ServerError("Failed to list members", error);
	}
});

export const POST = addDriveMembers.handler(
	async ({ params, body, user, event }) => {
		try {
			const added = await drivesService.addMembers(
				params.id,
				user.id,
				body.userIds,
				body.role,
			);
			// Only the newly added hear about it: a role change is not news,
			// and re-adding someone must not notify them twice.
			if (added.length > 0) {
				const [drive] = await drivesService
					.listForUser(user.id)
					.then((list) => list.filter((entry) => entry.id === params.id));
				await notifications.notifyMany(
					added,
					{
						type: "share",
						actorName: user.name,
						resourceName: drive?.name ?? null,
						link: `/drives/${params.id}`,
					},
					event.url.origin,
				);
			}
			return Http.Ok({ added });
		} catch (error) {
			rethrowRefusal(error);
			return Http.ServerError("Failed to add members", error);
		}
	},
);
