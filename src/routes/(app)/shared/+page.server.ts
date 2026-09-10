import { error } from "@sveltejs/kit";
import { isSimpleMode } from "$lib/server/config";
import { ShareService } from "$lib/server/services/shares";
import { toShareDto } from "$lib/server/services/shares.dto";
import { SharingService } from "$lib/server/services/sharings";

const shares = new ShareService();
const sharings = new SharingService();

export const load = async ({ locals, depends }) => {
	// Simple mode drops drive-only concepts — the nav hides this page, so does the router.
	if (isSimpleMode()) {
		return error(404);
	}

	depends("app:shares");

	if (!locals.user) {
		return { shares: [], sharedWithMe: [] };
	}

	const [links, sharedWithMe] = await Promise.all([
		shares.list(locals.user.id),
		sharings.listSharedWithMe(locals.user.id),
	]);

	return { shares: links.map(toShareDto), sharedWithMe };
};
