import { redirect } from "@sveltejs/kit";
import { config } from "$lib/config";

/** A docs-only site (`config.landing: null`) has nothing to show at `/` — send visitors straight into the guides. */
export const load = () => {
	if (!config.landing) {
		redirect(307, "/docs");
	}
};
