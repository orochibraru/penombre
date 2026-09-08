import { config } from "./config";
import {
	extractToc,
	makeLinkRewriter,
	orderPages,
	renderMarkdown,
	type TocEntry,
	titleFromMarkdown,
} from "./markdown";

/**
 * Sources every guide page straight from this site's own `docs/*.md`.
 * `import.meta.glob`'s `query: "?raw"` reads each file's text at build time,
 * so a page only ever reflects whatever's checked in — there's no runtime
 * fetch, and nothing here can drift from the source file without a rebuild
 * noticing (a renamed doc file 404s instead of silently serving a stale
 * copy). The path is a literal on purpose : Vite can only statically analyse
 * a literal glob, which is why `docs/` lives inside the site rather than
 * being a configurable path elsewhere on disk.
 */
const rawDocs = import.meta.glob("../../docs/*.md", {
	eager: true,
	import: "default",
	query: "?raw",
}) as Record<string, string>;

export type { TocEntry };

export interface DocPage {
	slug: string;
	title: string;
	html: string;
	toc: TocEntry[];
}

function slugFromPath(path: string): string {
	const filename = path.split("/").pop() ?? path;
	return filename.replace(/\.md$/, "");
}

// `docs/README.md` is the index of the guides rather than a guide itself
// (it's what someone reading the repo on GitHub lands on), so it gets no
// page of its own here — the landing page covers that role. Computed before
// the renderer below so a link *to* it from another doc still falls through
// to the repo-browser rewrite instead of a broken `/docs/README`.
const knownSlugs = Object.keys(rawDocs)
	.map(slugFromPath)
	.filter((slug) => slug !== "README");

const rewrite = makeLinkRewriter({
	knownSlugs,
	repoBrowseUrl: config.repoUrl
		? `${config.repoUrl.replace(/\/$/, "")}/blob/${config.repoBranch}`
		: undefined,
});

const pages: DocPage[] = Object.entries(rawDocs)
	.filter(([path]) => slugFromPath(path) !== "README")
	.map(([path, markdown]) => {
		const html = renderMarkdown(markdown, rewrite);
		return {
			html,
			slug: slugFromPath(path),
			title: titleFromMarkdown(markdown, slugFromPath(path)),
			toc: extractToc(html),
		};
	});

/** Every guide page, in the reading order `config.order` defines. */
export const docPages: DocPage[] = orderPages(pages, config.order);

/** First guide in reading order : where `/docs` and every "read the docs" link land. */
export const firstSlug: string | undefined = docPages[0]?.slug;

export function getDocPage(slug: string): DocPage | undefined {
	return docPages.find((page) => page.slug === slug);
}
