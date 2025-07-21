import { route } from "$lib/ROUTES";
import { redirect } from "@sveltejs/kit";

export const load = () => {
  return redirect(307, route("/browse"));
};
