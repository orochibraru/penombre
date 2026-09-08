import { marked } from "marked";

/**
 * Markdown → HTML, and nothing else : every function here is pure and takes
 * what it needs as an argument. The glob that actually reads `docs/*.md`
 * lives next door in `docs-content.ts`, because `import.meta.glob` is a Vite
 * compile-time transform and a module using it can't be imported by a plain
 * `bun test` run. Keeping it out of this file is what makes the logic below
 * — the slug algorithm, the link rewriting, the ordering — directly testable
 * (see `content.test.ts`).
 */

export interface TocEntry {
	id: string;
	text: string;
	depth: 2 | 3;
}

/**
 * Pulls the "On this page" outline straight out of the rendered HTML rather
 * than the markdown tokens, so it can't disagree with the actual heading
 * `id`s `makeRenderer()` assigns (including its duplicate-id suffixing).
 * h2/h3 only : h1 is the page title, and h4+ is rare enough that it would
 * only clutter a short sidebar list.
 */
export function extractToc(html: string): TocEntry[] {
	const entries: TocEntry[] = [];
	const headingRe = /<h([23]) id="([^"]+)">(.*?)<\/h\1>/g;
	for (const match of html.matchAll(headingRe)) {
		const depth = Number(match[1]) as 2 | 3;
		const id = match[2] ?? "";
		const text = (match[3] ?? "").replace(/<[^>]+>/g, "");
		entries.push({ depth, id, text });
	}
	return entries;
}

/**
 * GitHub's own heading-slug algorithm (lowercase, strip anything that isn't
 * a word char/space/hyphen, then replace *each* space with a hyphen without
 * collapsing runs of them) — matched deliberately, not simplified, because
 * markdown written for a repo has its `#anchor` links hand-written against
 * GitHub's actual rendering : "Custom domains & SSL" slugs to
 * `custom-domains--ssl` (the dropped `&` leaves a double space, and two
 * spaces become two hyphens). Collapsing runs of whitespace first — the more
 * "obvious" implementation — produces `custom-domains-ssl` instead and
 * quietly breaks that link.
 */
export function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/ /g, "-");
}

export interface LinkRewriteOptions {
	/** Slugs that have a page on this site, so a link to one can stay internal. */
	knownSlugs: Set<string> | string[];
	/** Base URL of the repo's file browser (`…/blob/main`), if there is one. */
	repoBrowseUrl?: string;
}

/**
 * The source markdown links the way it reads naturally from inside the repo
 * (`../CHANGELOG.md`, `services.md#some-heading`, `../compose.yaml`) —
 * correct for a file browser, but this site only publishes the guide pages
 * under `docs/`, so a plain relative link would 404 the static build's own
 * prerender crawl. Each link is rewritten once, at build time: another guide
 * (`slug.md`, optionally with a `#hash`) becomes `/docs/slug`, everything
 * else relative becomes a link into the repo's own file browser. Returns
 * `undefined` when there's no `repoBrowseUrl` to point at — the renderer
 * then drops the link entirely rather than emit a dead href the prerender
 * crawl would fail on.
 */
export function makeLinkRewriter(options: LinkRewriteOptions) {
	const known = new Set(options.knownSlugs);
	return function rewriteRelativeLink(href: string): string | undefined {
		if (/^(https?:|mailto:|#|\/)/.test(href)) {
			return href;
		}
		const [pathPart, hash] = href.split("#");
		const bare = (pathPart ?? "").replace(/^\.\.\//, "");
		const slug = bare.replace(/\.md$/, "");
		if (bare.endsWith(".md") && !bare.includes("/") && known.has(slug)) {
			return hash ? `/docs/${slug}#${hash}` : `/docs/${slug}`;
		}
		return options.repoBrowseUrl
			? `${options.repoBrowseUrl}/${bare}`
			: undefined;
	};
}

/**
 * One renderer per page (a fresh `usedIds` `Set` each time), so
 * `#some-heading` links inside the source markdown resolve to a real element
 * on this site too : marked doesn't add `id`s to headings on its own, unlike
 * GitHub's renderer.
 */
export function makeRenderer(rewrite: (href: string) => string | undefined) {
	const renderer = new marked.Renderer();
	const usedIds = new Set<string>();

	renderer.heading = ({ tokens, depth }) => {
		const text = renderer.parser.parseInline(tokens);
		// Strip whatever inline HTML parsing produced (`<code>`, `<em>`, ...)
		// back down to plain text before slugifying, rather than parsing the
		// tokens twice with a second throwaway renderer. Also decode the HTML
		// entities that same parsing introduces (`&` becomes `&amp;`) : left
		// undecoded, "Custom domains & SSL" slugs to `custom-domains-amp-ssl`
		// instead of GitHub's own `custom-domains--ssl` — the literal `amp`
		// survives `[^\w\s-]` stripping, since it's all word characters.
		const plain = decodeEntities(text.replace(/<[^>]+>/g, ""));
		const base = slugifyHeading(plain);
		let id = base;
		let n = 1;
		while (usedIds.has(id)) {
			id = `${base}-${n}`;
			n += 1;
		}
		usedIds.add(id);
		return `<h${depth} id="${id}">${text}</h${depth}>`;
	};

	renderer.link = ({ href, title, tokens }) => {
		const text = renderer.parser.parseInline(tokens);
		const rewritten = rewrite(href);
		if (!rewritten) {
			return text;
		}
		const titleAttr = title ? ` title="${title}"` : "";
		const external = /^https?:/.test(rewritten)
			? ' target="_blank" rel="noreferrer"'
			: "";
		return `<a href="${rewritten}"${titleAttr}${external}>${text}</a>`;
	};

	return renderer;
}

export function decodeEntities(text: string): string {
	return text
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&");
}

/** Renders one markdown file to HTML with the heading ids and link rewriting above. */
export function renderMarkdown(
	markdown: string,
	rewrite: (href: string) => string | undefined,
): string {
	return marked.parse(markdown, {
		async: false,
		renderer: makeRenderer(rewrite),
	}) as string;
}

/** First `# Heading` in the file, which is the page's title. */
export function titleFromMarkdown(markdown: string, fallback: string): string {
	const heading = markdown.match(/^#\s+(.+)$/m);
	return heading?.[1]?.trim() ?? fallback;
}

/** Orders pages by `order`; anything not listed sorts after, alphabetically, rather than silently vanishing from the nav. */
export function orderPages<T extends { slug: string }>(
	pages: T[],
	order: string[],
): T[] {
	return [...pages].sort((a, b) => {
		const ai = order.indexOf(a.slug);
		const bi = order.indexOf(b.slug);
		if (ai === -1 && bi === -1) {
			return a.slug.localeCompare(b.slug);
		}
		if (ai === -1) {
			return 1;
		}
		if (bi === -1) {
			return -1;
		}
		return ai - bi;
	});
}
