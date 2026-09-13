import { Http } from "$lib/server/http";
import { markNotificationsRead } from "$lib/server/openapi/v1/notifications";
import { NotificationService } from "$lib/server/services/notifications";

const notifications = new NotificationService();

export const POST = markNotificationsRead.handler(async ({ body, user }) => {
	try {
		const read = await notifications.markRead(user.id, body.ids);
		return Http.Ok({ read, unread: await notifications.unreadCount(user.id) });
	} catch (error) {
		return Http.ServerError("Failed to mark notifications read", error);
	}
});
