import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { StatsService } from "$lib/server/services/stats";

const stats = new StatsService();

export const load = async ({ locals }) => {
	if (!locals.storageOwner) {
		return redirect(307, resolve("/auth/sign-in"));
	}
	// Usage is the drive's, not the viewer's — in simple mode that is the
	// shared owner's, or every account but the first reported an empty drive.
	return { stats: await stats.forUser(locals.storageOwner.id) };
};
