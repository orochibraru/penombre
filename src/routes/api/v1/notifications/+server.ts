import { Http } from "#lib/server/http.js";
import { listNotifications } from "#lib/server/openapi/v1/notifications.js";
import { NotificationService } from "#lib/server/services/notifications.js";

const notifications = new NotificationService();

/**
 * Addressed to the session user, never the storage owner: a notification is
 * for whoever it names, and in simple mode everyone shares one drive but not
 * one inbox.
 */
export const GET = listNotifications.handler(async ({ query, user }) => {
	try {
		const [rows, unread] = await Promise.all([
			notifications.list(user.id, query.limit),
			notifications.unreadCount(user.id),
		]);
		return Http.Ok({ notifications: rows, unread });
	} catch (error) {
		return Http.ServerError("Failed to list notifications", error);
	}
});
