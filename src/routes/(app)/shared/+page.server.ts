import { error } from "@sveltejs/kit";
import { isSimpleMode } from "$lib/server/config";
import { ShareService } from "$lib/server/services/shares";
import { toShareDto } from "$lib/server/services/shares.dto";

const shares = new ShareService();

export const load = async ({ locals, depends }) => {
	// Simple mode drops drive-only concepts — the nav hides this page, so does the router.
	if (isSimpleMode()) {
		return error(404);
	}

	depends("app:shares");

	if (!locals.user) {
		return { shares: [] };
	}

	const links = await shares.list(locals.user.id);
	return { shares: links.map(toShareDto) };
};
