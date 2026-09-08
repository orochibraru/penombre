import { decodeEntities } from "./markdown";

/**
 * Client-side search over the guides, with no index file and no dependency :
 * every page's rendered HTML is already in the bundle (the docs layout's
 * sidebar imports the same data), so searching is a substring scan over text
 * that is sitting in memory anyway. At the scale a personal docs site
 * actually reaches — tens of pages, a few hundred KB of prose — that is
 * instant, and it never surprises a reader with a fuzzy ranking that put the
 * wrong page first.
 *
 * Takes its pages as an argument rather than importing them, so it stays
 * independent of `docs-content.ts`'s Vite-only glob and can be tested with
 * plain fixtures.
 *
 * ponytail: lowercase substring matching, no typo tolerance and no stemming.
 * Reach for a real index (Pagefind, MiniSearch) if a site ever outgrows "all
 * of it fits in the bundle" — realistically past ~50 pages.
 */

export interface SearchablePage {
	slug: string;
	title: string;
	html: string;
}

/** One heading's worth of a page : the unit a result links to, so a hit lands on `#the-heading` rather than the top of a long guide. */
export interface Section {
	slug: string;
	title: string;
	/** Heading id to link to; `""` for the text above a page's first heading. */
	id: string;
	/** Heading text; `""` for that same leading block, which has no heading of its own. */
	heading: string;
	depth: number;
	text: string;
}

export interface SearchResult {
	slug: string;
	title: string;
	/** Full href, including the heading anchor. */
	href: string;
	/** Heading the hit sits under, or the page title for a hit above the first heading. */
	heading: string;
	snippet: string;
	/** Offsets of the match inside `snippet`, for highlighting without `{@html}`. `-1` when only the heading or title matched. */
	matchStart: number;
	matchLength: number;
	score: number;
}

const HEADING_RE = /<h([1-6]) id="([^"]*)">(.*?)<\/h\1>/g;

/** Rendered HTML back down to readable prose : tags out, entities decoded, whitespace collapsed so a snippet never spans a markdown line break. */
export function toText(html: string): string {
	return decodeEntities(
		html
			.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
			.replace(/<[^>]+>/g, " "),
	)
		.replace(/\s+/g, " ")
		.trim();
}

/** Splits one page's rendered HTML at its headings. */
export function sectionsOf(page: SearchablePage): Section[] {
	const sections: Section[] = [];
	let current = { depth: 1, heading: "", id: "", start: 0 };

	const push = (end: number) => {
		const text = toText(page.html.slice(current.start, end));
		// The block above a page's first heading is normally empty (the h1 is
		// the first thing on the page): no text and no heading of its own
		// means there is nothing here anyone could match.
		if (text || current.heading) {
			sections.push({
				depth: current.depth,
				heading: current.heading,
				id: current.id,
				slug: page.slug,
				text,
				title: page.title,
			});
		}
	};

	for (const match of page.html.matchAll(HEADING_RE)) {
		push(match.index);
		current = {
			depth: Number(match[1]),
			heading: toText(match[3] ?? ""),
			id: match[2] ?? "",
			start: match.index + match[0].length,
		};
	}
	push(page.html.length);
	return sections;
}

const PAD = 60;

/** A window of `text` around `at`, padded on both sides and ellipsised where it was cut. */
function snippetAround(text: string, at: number, length: number) {
	const from = Math.max(0, at - PAD);
	const to = Math.min(text.length, at + length + PAD);
	const head = from > 0 ? "…" : "";
	return {
		matchStart: at - from + head.length,
		snippet: head + text.slice(from, to) + (to < text.length ? "…" : ""),
	};
}

// Sectioning every page costs one pass over all the HTML, so it's done once
// and kept: the pages array is a module-level constant on the site side,
// only ever one of them per page load.
let cache: { pages: SearchablePage[]; sections: Section[] } | undefined;

function sectionsFor(pages: SearchablePage[]): Section[] {
	if (cache?.pages !== pages) {
		cache = { pages, sections: pages.flatMap(sectionsOf) };
	}
	return cache.sections;
}

/**
 * Ranked matches for `query`. A hit in a page's title (its h1) outranks one
 * in a lower heading, which outranks one in the body; ties keep the guides'
 * reading order, since `Array.prototype.sort` is stable and the sections are
 * built in that order.
 */
export function search(
	pages: SearchablePage[],
	query: string,
	limit = 8,
): SearchResult[] {
	const q = query.trim().toLowerCase();
	if (q.length < 2) {
		return [];
	}

	const results: SearchResult[] = [];
	for (const section of sectionsFor(pages)) {
		const inTitle = section.title.toLowerCase().includes(q);
		const headingAt = section.heading.toLowerCase().indexOf(q);
		const textAt = section.text.toLowerCase().indexOf(q);
		if (!inTitle && headingAt === -1 && textAt === -1) {
			continue;
		}

		// Show the reader the body hit if there is one, otherwise the opening
		// of the section whose heading (or page title) matched.
		const window =
			textAt === -1
				? {
						matchLength: 0,
						matchStart: -1,
						snippet: snippetAround(section.text, 0, 0).snippet,
					}
				: {
						matchLength: q.length,
						...snippetAround(section.text, textAt, q.length),
					};

		results.push({
			heading: section.heading || section.title,
			href: section.id
				? `/docs/${section.slug}#${section.id}`
				: `/docs/${section.slug}`,
			score:
				headingAt !== -1 && section.depth === 1
					? 3
					: headingAt !== -1 || inTitle
						? 2
						: 1,
			slug: section.slug,
			title: section.title,
			...window,
		});
	}

	return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
