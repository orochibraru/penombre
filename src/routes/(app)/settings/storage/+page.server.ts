import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { StatsService } from "$lib/server/services/stats";

const stats = new StatsService();

export const load = async ({ locals }) => {
	if (!locals.user) {
		return redirect(307, resolve("/auth/sign-in"));
	}
	return { stats: await stats.forUser(locals.user.id) };
};
