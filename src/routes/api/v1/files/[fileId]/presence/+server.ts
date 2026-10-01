import { Http } from "#lib/server/http.js";
import {
	beatPresence,
	leavePresence,
} from "#lib/server/openapi/v1/presence.js";
import { PresenceService } from "#lib/server/services/presence.js";

const presence = new PresenceService();

export const POST = beatPresence.handler(
	async ({ params, body, user, service }) => {
		try {
			const others = await presence.beatIfReachable(
				service,
				params.fileId,
				user.id,
				body.mode,
			);
			return others ? Http.Ok(others) : Http.NotFound("File not found");
		} catch (error) {
			return Http.ServerError("Failed to record presence", error);
		}
	},
);

/** Only ever removes the caller's own row, so it needs no access check. */
export const DELETE = leavePresence.handler(async ({ params, user }) => {
	try {
		return Http.Ok({ left: await presence.leave(params.fileId, user.id) });
	} catch (error) {
		return Http.ServerError("Failed to clear presence", error);
	}
});
