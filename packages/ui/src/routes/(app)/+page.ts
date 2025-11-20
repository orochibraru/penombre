import { redirect } from "@sveltejs/kit";
import { route } from "$lib/ROUTES";

export const load = () => {
	throw redirect(307, route("/browse"));
};
