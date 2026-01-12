import { redirect } from "@sveltejs/kit";
import { route } from "$lib/ROUTES";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
	return redirect(307, route("/browse"));
};
