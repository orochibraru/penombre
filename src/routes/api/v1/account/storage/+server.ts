import { isDriveOnly } from "#lib/server/auth/drive-only.js";
import { Http } from "#lib/server/http.js";
import { getAccountStorage } from "#lib/server/openapi/v1/account.js";
import { StatsService } from "#lib/server/services/stats.js";

const stats = new StatsService();

/** The drive's usage, not the viewer's: in simple mode, the shared owner's. */
export const GET = getAccountStorage.handler(async ({ user, event }) => {
	if (isDriveOnly(user)) {
		return Http.Forbidden("A drive-only account has no drive of its own");
	}
	try {
		const owner = event.locals.storageOwner ?? user;
		const usage = await stats.forUser(owner.id);
		return Http.Ok({
			...usage,
			largestFiles: usage.largestFiles.map((file) => ({
				...file,
				updatedAt: file.updatedAt.toISOString(),
			})),
		});
	} catch (error) {
		return Http.ServerError("Failed to read storage usage", error);
	}
});
