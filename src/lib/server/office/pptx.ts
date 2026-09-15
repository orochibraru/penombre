import { SLIDE_SEPARATOR } from "$lib/documents";
import {
	isTitle,
	NotAPresentationError,
	placeholderType,
	resizeDeck,
	type SlideRef,
	shapeTree,
	slideRefs,
	textShapes,
} from "./pptx-package";
import {
	childNamed,
	childrenNamed,
	element,
	findElement,
	isElement,
	parseXml,
	serializeXml,
	text,
	textContent,
	type XmlElement,
	type XmlNode,
} from "./xml";
import { partText, setPartText, type ZipEntry } from "./zip";

/**
 * A deck as the Markdown the slide editor speaks, and back.
 *
 * Text is written into the shapes the slide already has, so a slide keeps its
 * layout, its placeholders' geometry, its theme, its pictures and the run
 * formatting of every paragraph that was already there. Slides are added by
 * copying one, not by inventing one, for the same reason.
 *
 * Slides are matched to Markdown blocks by position. The editor can add and
 * delete slides but not reorder them, so that holds — but deleting a slide
 * from the middle shifts the layouts of the ones after it, which
 * `docs/documents.md` warns about.
 */

const BULLET = /^(\s*)[-*]\s+(.*)$/;

// =========================================================================
// Reading
// =========================================================================

/** A run as Markdown, carrying whichever of bold and italic it has. */
function runMarkdown(run: XmlElement): string {
	const body = textContent(run);
	if (body === "") {
		return "";
	}
	const properties = childNamed(run, "a:rPr");
	const marker =
		(properties?.attrs.b === "1" ? "**" : "") +
		(properties?.attrs.i === "1" ? "*" : "");
	return marker === "" ? body : `${marker}${body}${marker}`;
}

function paragraphMarkdown(paragraph: XmlElement): string {
	return paragraph.children
		.filter((child): child is XmlElement => isElement(child))
		.map((child) => {
			if (child.name === "a:r") {
				return runMarkdown(child);
			}
			return child.name === "a:br" ? "\n" : "";
		})
		.join("");
}

function indentOf(paragraph: XmlElement): number {
	const level = Number(childNamed(paragraph, "a:pPr")?.attrs.lvl ?? "0");
	return Number.isFinite(level) ? level : 0;
}

/** One shape's paragraphs as Markdown lines. */
function shapeMarkdown(shape: XmlElement): string[] {
	const body = childNamed(shape, "p:txBody");
	if (!body) {
		return [];
	}
	const paragraphs = childrenNamed(body, "a:p");
	if (isTitle(shape)) {
		const title = paragraphs.map(paragraphMarkdown).join(" ").trim();
		return title === "" ? [] : [`# ${title}`];
	}
	// A subtitle is prose under a title, not a list of points.
	const prose = placeholderType(shape) === "subTitle";
	return paragraphs.map((paragraph) => {
		const line = paragraphMarkdown(paragraph);
		if (line.trim() === "") {
			return "";
		}
		return prose ? line : `${"  ".repeat(indentOf(paragraph))}- ${line}`;
	});
}

export function pptxToMarkdown(entries: ZipEntry[]): string {
	const slides = slideRefs(entries).map((slide) => {
		const lines = textShapes(shapeTree(entries, slide.part)).flatMap((shape) =>
			shapeMarkdown(shape),
		);
		return lines.join("\n").trim();
	});
	return slides.length > 0 ? `${slides.join(SLIDE_SEPARATOR)}\n` : "";
}

// =========================================================================
// Writing
// =========================================================================

interface Line {
	text: string;
	level: number;
}

interface SlideText {
	title: string | null;
	lines: Line[];
}

/** Split one slide's Markdown into its title and its remaining lines. */
function parseSlide(markdown: string): SlideText {
	let title: string | null = null;
	const lines: Line[] = [];

	for (const raw of markdown.split("\n")) {
		const heading = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(raw);
		if (heading && title === null) {
			title = (heading[2] ?? "").trim();
			continue;
		}
		const bullet = BULLET.exec(raw);
		if (bullet) {
			lines.push({
				text: bullet[2] ?? "",
				// Two spaces per level, which is what the editor's own preview
				// and every Markdown tool treat as one step of nesting.
				level: Math.floor((bullet[1]?.length ?? 0) / 2),
			});
			continue;
		}
		if (raw.trim() !== "" || lines.length > 0) {
			lines.push({ text: raw.trim(), level: 0 });
		}
	}

	// Trailing blank lines are the editor's, not the slide's.
	while (lines.at(-1)?.text === "") {
		lines.pop();
	}
	return { title, lines };
}

const EMPHASIS = /(\*\*[^*]+\*\*|\*[^*]+\*)/;

/** Markdown emphasis as runs, each keeping the shape's own run formatting. */
function runsFor(
	value: string,
	template: XmlElement | undefined,
): XmlElement[] {
	return value
		.split(EMPHASIS)
		.filter((piece) => piece !== "")
		.map((piece) => {
			const bold = piece.startsWith("**") && piece.endsWith("**");
			const italic = !bold && piece.startsWith("*") && piece.endsWith("*");
			const body = bold
				? piece.slice(2, -2)
				: italic
					? piece.slice(1, -1)
					: piece;

			const properties = template
				? (structuredClone(template) as XmlElement)
				: element("a:rPr", { lang: "en-US", dirty: "0" });
			if (bold) {
				properties.attrs.b = "1";
			}
			if (italic) {
				properties.attrs.i = "1";
			}
			return element("a:r", {}, [properties, element("a:t", {}, [text(body)])]);
		});
}

/** The `a:rPr` of the first run in a body, reused so new text looks the same. */
function runTemplate(body: XmlElement): XmlElement | undefined {
	for (const paragraph of childrenNamed(body, "a:p")) {
		const run = childNamed(paragraph, "a:r");
		const properties = run && childNamed(run, "a:rPr");
		if (properties) {
			return properties;
		}
	}
	return undefined;
}

/** Paragraph properties for a line, from the original at the same level. */
function paragraphProperties(
	level: number,
	exemplars: Map<number, XmlElement>,
): XmlElement | null {
	const exact = exemplars.get(level);
	if (exact) {
		return structuredClone(exact) as XmlElement;
	}
	return level > 0 ? element("a:pPr", { lvl: String(level) }) : null;
}

/** Replace a shape's paragraphs, keeping its body properties and styling. */
function setShapeText(shape: XmlElement, lines: Line[]): void {
	const body = childNamed(shape, "p:txBody");
	if (!body) {
		return;
	}
	const template = runTemplate(body);
	const exemplars = new Map<number, XmlElement>();
	for (const paragraph of childrenNamed(body, "a:p")) {
		const properties = childNamed(paragraph, "a:pPr");
		const level = indentOf(paragraph);
		if (properties && !exemplars.has(level)) {
			exemplars.set(level, properties);
		}
	}

	// bodyPr and lstStyle are the shape's text box, not its text.
	const kept = body.children.filter(
		(child): child is XmlElement =>
			isElement(child) &&
			(child.name === "a:bodyPr" || child.name === "a:lstStyle"),
	);

	const paragraphs = lines.map((line) => {
		const properties = paragraphProperties(line.level, exemplars);
		const runs = runsFor(line.text, template);
		const children: XmlNode[] = properties ? [properties, ...runs] : runs;
		return element("a:p", {}, children);
	});

	body.children = [
		...kept,
		...(paragraphs.length > 0 ? paragraphs : [element("a:p")]),
	];
}

/**
 * A plain text box, for text on a slide whose layout has nowhere to put it —
 * a picture-only slide the user typed into. Placed in the lower half so it
 * does not land on top of the title.
 */
function newTextBox(id: number, lines: Line[]): XmlElement {
	const shape = element("p:sp", {}, [
		element("p:nvSpPr", {}, [
			element("p:cNvPr", { id: String(id), name: `TextBox ${id}` }),
			element("p:cNvSpPr", {}, [element("a:spLocks", { noGrp: "1" })]),
			element("p:nvPr"),
		]),
		element("p:spPr", {}, [
			element("a:xfrm", {}, [
				element("a:off", { x: "838200", y: "2500313" }),
				element("a:ext", { cx: "7772400", cy: "3000000" }),
			]),
			element("a:prstGeom", { prst: "rect" }, [element("a:avLst")]),
		]),
		element("p:txBody", {}, [element("a:bodyPr"), element("a:lstStyle")]),
	]);
	setShapeText(shape, lines);
	return shape;
}

/** The largest shape id on a slide, so a new shape gets a free one. */
function nextShapeId(tree: XmlElement): number {
	let highest = 1;
	for (const node of [tree, ...textShapes(tree)]) {
		for (const name of ["p:cNvPr", "p:cNvGrpSpPr"]) {
			const id = Number(findElement(node, name)?.attrs.id ?? 0);
			highest = Math.max(highest, Number.isFinite(id) ? id : 0);
		}
	}
	return highest + 1;
}

function writeSlide(
	entries: ZipEntry[],
	slide: SlideRef,
	content: SlideText,
): void {
	const source = partText(entries, slide.part);
	if (!source) {
		throw new NotAPresentationError(`Missing slide part ${slide.part}`);
	}
	const document = parseXml(source);
	const tree = findElement(document.root, "p:spTree");
	if (!tree) {
		throw new NotAPresentationError(`Slide ${slide.part} has no shape tree`);
	}

	const shapes = textShapes(tree);
	const title = shapes.find((shape) => isTitle(shape));
	const body = shapes.find((shape) => !isTitle(shape));

	if (title) {
		setShapeText(
			title,
			content.title === null ? [] : [{ text: content.title, level: 0 }],
		);
	}
	if (body) {
		setShapeText(body, content.lines);
	} else if (content.lines.length > 0) {
		// The layout has nowhere for this text; rather than drop it, give the
		// slide a text box of its own.
		tree.children.push(newTextBox(nextShapeId(tree), content.lines));
	}

	setPartText(entries, slide.part, serializeXml(document));
}

/** Apply an edited deck to the presentation, in place on `entries`. */
export function markdownToPptx(entries: ZipEntry[], markdown: string): void {
	const blocks = markdown
		.split(/^\s*---\s*$/m)
		.map((block) => block.trim())
		.filter((block, _index, all) => block !== "" || all.length === 1);
	const wanted = blocks.length > 0 ? blocks : [""];

	const slides = resizeDeck(entries, wanted.length);
	slides.forEach((slide, index) => {
		writeSlide(entries, slide, parseSlide(wanted[index] ?? ""));
	});
}
