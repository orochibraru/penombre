import { describe, expect, test } from "bun:test";
import { parseSlides, titleFromContent } from "#lib/documents.js";
import {
	deckTheme,
	isInverted,
	parseDeck,
	readSlide,
	setInverted,
	setPaginated,
	setSlideClass,
	setTheme,
	slideLooks,
	slideTexts,
	withFrontMatter,
	writeDeck,
	writeSlide,
} from "./format";

const MARP = `---
marp: true
theme: gaia
paginate: true
---

<!-- _class: lead -->

# Title

<!-- Say hello first. -->

---

## Two

- a
`;

describe("front matter", () => {
	test("is not a slide, and is written back verbatim", () => {
		const deck = parseDeck(MARP);
		expect(deck.frontMatter).toBe("marp: true\ntheme: gaia\npaginate: true");
		expect(deck.slides).toHaveLength(2);
		expect(writeDeck(deck)).toBe(MARP);
	});

	test("a deck that merely opens with a ruler has none", () => {
		expect(parseDeck("---\n# One\n---\n# Two").frontMatter).toBeNull();
		expect(slideTexts("---\n# One\n---\n# Two")).toEqual(["# One", "# Two"]);
	});

	test("keeps the title rename working on Marp decks", () => {
		expect(titleFromContent("presentation", MARP)).toBe("Title");
		expect(parseSlides(MARP)[0]).toBe("# Title");
	});

	test("adds Marp's own marker when there was none", () => {
		expect(withFrontMatter(null, "theme", "gaia")).toBe(
			"marp: true\ntheme: gaia",
		);
		expect(withFrontMatter("marp: true\ntheme: gaia", "theme", null)).toBe(
			"marp: true",
		);
		expect(withFrontMatter(null, "paginate", null)).toBeNull();
	});

	test("reads CRLF files", () => {
		expect(parseDeck("---\r\ntheme: uncover\r\n---\r\n# A").frontMatter).toBe(
			"theme: uncover",
		);
	});
});

describe("slides", () => {
	test("a ruler inside fenced code does not split", () => {
		const text = "# A\n\n```\n---\n```\n\n---\n\n# B";
		expect(slideTexts(text)).toEqual(["# A\n\n```\n---\n```", "# B"]);
	});

	test("every Marp ruler splits", () => {
		expect(slideTexts("a\n\n***\n\nb\n\n___\n\nc")).toEqual(["a", "b", "c"]);
	});

	test("comments become directives or notes", () => {
		const slide = readSlide(
			"<!-- _class: lead -->\n# T\n<!--\nfirst\nsecond\n-->\n<!-- more -->",
		);
		expect(slide).toEqual({
			body: "# T",
			notes: "first\nsecond\n\nmore",
			directives: { _class: "lead" },
		});
	});

	test("Marp's fitting heading stays in the heading", () => {
		const slide = readSlide("# <!-- fit --> Big");
		expect(slide).toEqual({
			body: "# <!-- fit --> Big",
			notes: "",
			directives: {},
		});
	});

	test("a comment in fenced code is code, not a note", () => {
		const slide = readSlide("```html\n<!-- keep -->\n```");
		expect(slide.notes).toBe("");
		expect(slide.body).toBe("```html\n<!-- keep -->\n```");
	});

	test("notes cannot close their own comment", () => {
		const text = writeSlide({ body: "x", notes: "a --> b", directives: {} });
		expect(text).toBe("x\n\n<!-- a -- > b -->");
		expect(readSlide(text).notes).toBe("a -- > b");
	});

	test("directive values that YAML would misread are quoted", () => {
		const slide = {
			body: "",
			notes: "",
			directives: { _backgroundColor: "#fff", _footer: "a --> b" },
		};
		const text = writeSlide(slide);
		expect(text).not.toContain("-->  b");
		expect(readSlide(text).directives).toEqual(slide.directives);
	});

	test("round-trips a parsed deck", () => {
		const deck = parseDeck(MARP);
		expect(parseDeck(writeDeck(deck))).toEqual(deck);
	});

	test("an empty file is one empty slide", () => {
		expect(parseDeck("").slides).toEqual([
			{ body: "", notes: "", directives: {} },
		]);
	});
});

describe("looks", () => {
	test("a plain directive carries on, an underscored one does not", () => {
		const deck = parseDeck(
			"# A\n\n---\n\n<!-- class: invert -->\n# B\n\n---\n\n<!-- _class: lead -->\n# C\n\n---\n\n# D",
		);
		expect(slideLooks(deck).map((look) => look.className)).toEqual([
			"",
			"invert",
			"lead",
			"invert",
		]);
	});

	test("paginate comes from front matter", () => {
		const looks = slideLooks(parseDeck(MARP));
		expect(looks.every((look) => look.paginate)).toBe(true);
	});

	test("the theme is Marp's name, or default", () => {
		expect(deckTheme(parseDeck(MARP))).toBe("gaia");
		expect(deckTheme(parseDeck("---\ntheme: nope\n---\n# A"))).toBe("default");
		const deck = parseDeck("# A");
		setTheme(deck, "uncover");
		expect(writeDeck(deck)).toBe(
			"---\nmarp: true\ntheme: uncover\n---\n\n# A\n",
		);
	});

	test("a title slide keeps the deck's dark class", () => {
		const deck = parseDeck("---\nclass: invert\n---\n\n# A");
		setSlideClass(deck, 0, "lead", true);
		expect(deck.slides[0]?.directives._class).toBe("invert lead");
		setSlideClass(deck, 0, "lead", false);
		expect(deck.slides[0]?.directives).toEqual({});
	});

	test("dark mode reaches slides that override the class", () => {
		const deck = parseDeck("<!-- _class: lead -->\n# A\n\n---\n\n# B");
		setInverted(deck, true);
		expect(isInverted(deck)).toBe(true);
		expect(slideLooks(deck).map((look) => look.className)).toEqual([
			"lead invert",
			"invert",
		]);
		setInverted(deck, false);
		expect(deck.frontMatter).toBe("marp: true");
		expect(deck.slides[0]?.directives._class).toBe("lead");
	});

	test("page numbers toggle in front matter", () => {
		const deck = parseDeck("# A");
		setPaginated(deck, true);
		expect(deck.frontMatter).toBe("marp: true\npaginate: true");
		setPaginated(deck, false);
		expect(deck.frontMatter).toBe("marp: true");
	});
});
