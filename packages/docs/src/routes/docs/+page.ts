import { redirect } from "@sveltejs/kit";
import { firstSlug } from "$lib/docs-content";

/** `/docs` has no content of its own : it's the stable href every "read the docs" link points at, resolved here to whichever guide `config.order` puts first. */
export const load = () => {
	redirect(307, firstSlug ? `/docs/${firstSlug}` : "/");
};
