import { error } from "@sveltejs/kit";
import { docPages, getDocPage } from "$lib/docs-content";

/** Every known doc slug, so the static adapter prerenders each one instead of falling back to a 404 page for a link that should genuinely resolve. */
export function entries() {
	return docPages.map((doc) => ({ slug: doc.slug }));
}

export const load = ({ params }) => {
	const doc = getDocPage(params.slug);
	if (!doc) {
		error(404, "Doc page not found");
	}
	const index = docPages.indexOf(doc);
	return {
		doc,
		next: docPages[index + 1],
		prev: docPages[index - 1],
	};
};
