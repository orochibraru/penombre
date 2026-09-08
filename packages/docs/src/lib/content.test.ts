/**
 * The logic worth a test : the pieces that are quietly wrong rather than
 * loudly broken — a heading slug that doesn't match the anchor someone
 * hand-wrote, a relative link that survives to 404 the prerender crawl, a
 * search hit that points at the top of a long page instead of the heading it
 * matched. Run with `bun test`.
 */
import { expect, test } from "bun:test";
import {
	extractToc,
	makeLinkRewriter,
	orderPages,
	renderMarkdown,
	slugifyHeading,
	titleFromMarkdown,
} from "./markdown";
import { search, sectionsOf, toText } from "./search";

const keep = (href: string) => href;

test("heading slugs match GitHub's, including its double hyphen", () => {
	// The whole reason this isn't the obvious "collapse whitespace" version:
	// a hand-written #custom-domains--ssl anchor has to keep resolving.
	expect(slugifyHeading("Custom domains & SSL")).toBe("custom-domains--ssl");
	expect(slugifyHeading("Getting started")).toBe("getting-started");
	expect(slugifyHeading("  Trailing space  ")).toBe("trailing-space");
});

test("rendered headings carry ids, and duplicates are suffixed", () => {
	const html = renderMarkdown("## Setup\n\ntext\n\n## Setup\n", keep);
	expect(html).toContain('<h2 id="setup">Setup</h2>');
	expect(html).toContain('<h2 id="setup-1">Setup</h2>');
});

test("an entity-bearing heading slugs off the decoded text, not `amp`", () => {
	const html = renderMarkdown("## Custom domains & SSL\n", keep);
	expect(html).toContain('id="custom-domains--ssl"');
});

test("a link to another guide stays internal, keeping its hash", () => {
	const rewrite = makeLinkRewriter({ knownSlugs: ["services"] });
	expect(rewrite("services.md")).toBe("/docs/services");
	expect(rewrite("services.md#volumes")).toBe("/docs/services#volumes");
	expect(rewrite("../services.md")).toBe("/docs/services");
});

test("absolute, external and in-page links are left alone", () => {
	const rewrite = makeLinkRewriter({ knownSlugs: ["services"] });
	for (const href of [
		"https://example.com",
		"mailto:a@b.c",
		"#anchor",
		"/docs/x",
	]) {
		expect(rewrite(href)).toBe(href);
	}
});

test("a link to an unpublished repo file goes to the repo browser", () => {
	const rewrite = makeLinkRewriter({
		knownSlugs: ["services"],
		repoBrowseUrl: "https://github.com/me/proj/blob/main",
	});
	expect(rewrite("../compose.yaml")).toBe(
		"https://github.com/me/proj/blob/main/compose.yaml",
	);
	// Not a known guide: it's a repo file too, not a dead /docs/ link.
	expect(rewrite("unknown.md")).toBe(
		"https://github.com/me/proj/blob/main/unknown.md",
	);
});

test("without a repo URL an unresolvable link is dropped, not left dead", () => {
	const rewrite = makeLinkRewriter({ knownSlugs: ["services"] });
	expect(rewrite("../compose.yaml")).toBeUndefined();
	// The renderer turns that into plain text — a dead href would fail the
	// static build's prerender crawl instead.
	expect(renderMarkdown("[the file](../compose.yaml)", rewrite)).not.toContain(
		"<a ",
	);
});

test("the toc lists h2/h3 only, with the ids the renderer assigned", () => {
	const html = renderMarkdown(
		"# Title\n\n## One\n\n### Two\n\n#### Three\n",
		keep,
	);
	expect(extractToc(html)).toEqual([
		{ depth: 2, id: "one", text: "One" },
		{ depth: 3, id: "two", text: "Two" },
	]);
});

test("the title is the first h1, falling back to the slug", () => {
	expect(titleFromMarkdown("# Real title\n\nbody", "slug")).toBe("Real title");
	expect(titleFromMarkdown("no heading here", "slug")).toBe("slug");
});

test("pages follow the configured order, unlisted ones last and alphabetical", () => {
	const pages = [
		{ slug: "zebra" },
		{ slug: "apple" },
		{ slug: "second" },
		{ slug: "first" },
	];
	expect(orderPages(pages, ["first", "second"]).map((p) => p.slug)).toEqual([
		"first",
		"second",
		"apple",
		"zebra",
	]);
});

const page = {
	html: renderMarkdown(
		"# Storage\n\nIntro about disks, volumes and backups.\n\n## Volumes\n\nA volume is mounted into a service.\n\n## Backups\n\nScheduled to any bucket.\n",
		keep,
	),
	slug: "storage",
	title: "Storage",
};

test("sections split at headings and keep their anchor id", () => {
	const sections = sectionsOf(page);
	expect(sections.map((s) => s.id)).toEqual(["storage", "volumes", "backups"]);
	expect(sections[1]?.text).toBe("A volume is mounted into a service.");
});

test("a body hit links to the heading above it, not the page top", () => {
	const [hit] = search([page], "mounted");
	expect(hit?.href).toBe("/docs/storage#volumes");
	expect(hit?.heading).toBe("Volumes");
});

test("the snippet clips around the match and marks where it is", () => {
	const [hit] = search([page], "mounted");
	const { snippet, matchStart, matchLength } = hit ?? {
		matchLength: 0,
		matchStart: -1,
		snippet: "",
	};
	expect(snippet.slice(matchStart, matchStart + matchLength)).toBe("mounted");
});

test("a heading hit outranks a body hit for the same word", () => {
	// "backups" is both a heading and a word in the intro paragraph: the
	// heading is the one a reader means.
	const results = search([page], "backups");
	expect(results.length).toBe(2);
	expect(results[0]?.href).toBe("/docs/storage#backups");
	expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
});

test("a title hit ranks highest and a one-character query matches nothing", () => {
	expect(search([page], "storage")[0]?.score).toBe(3);
	expect(search([page], "s")).toEqual([]);
	expect(search([page], "nothing-here-at-all")).toEqual([]);
});

test("html is stripped and entities decoded before matching", () => {
	expect(toText("<p>a &amp; b</p>\n<p>  c  </p>")).toBe("a & b c");
});
