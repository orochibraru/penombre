import { slideFromLayout } from "#lib/slides/layouts.js";
import type { Deck, Fill, SlideElement } from "#lib/slides/model.js";
import { renderSlideSvg } from "#lib/slides/render-svg.js";
import { templateDeck, templateSpec } from "#lib/slides/templates/index.js";
import { readZip, writeZip, type ZipEntry } from "../zip";
import { skeleton } from "./package";
import { readDeck } from "./read";
import { writeDeck } from "./write";

/**
 * Presentations as the slide editor sees them: read, written back, made
 * from a template, and drawn page by page for a PDF.
 */

export { readDeck, writeDeck };

/** A new `.pptx` on a template, with a title slide saying `title`. */
export function templatePackage(id: string, title: string): Buffer | null {
	const spec = templateSpec(id);
	const deck = templateDeck(id);
	const layout = deck?.layouts[0];
	if (!spec || !deck || !layout) {
		return null;
	}
	const entries = skeleton(spec, title);
	writeDeck(entries, {
		...deck,
		slides: [slideFromLayout(layout, { title: [title] })],
	});
	return writeZip(entries);
}

const MIME: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	bmp: "image/bmp",
	svg: "image/svg+xml",
	webp: "image/webp",
};

/** A package part as a data URL, for pictures a browser can draw. */
export function mediaDataUrl(entries: ZipEntry[], src: string): string | null {
	if (src.startsWith("data:")) {
		return src;
	}
	const type = MIME[src.split(".").pop()?.toLowerCase() ?? ""];
	const entry = entries.find((candidate) => candidate.name === src);
	if (!type || !entry) {
		return null;
	}
	return `data:${type};base64,${Buffer.from(entry.data).toString("base64")}`;
}

/** Every slide shown in a presentation as an SVG document, in order. */
export function slidesPdfPages(bytes: ArrayBuffer | Uint8Array): string[] {
	const entries = readZip(bytes);
	const deck: Deck = readDeck(entries);
	return deck.slides
		.filter((slide) => !slide.hidden)
		.map((slide) =>
			renderSlideSvg(deck, slide, {
				width: 1280,
				image: (src) => mediaDataUrl(entries, src),
			}),
		);
}

/**
 * The deck with every picture inlined as a data URL, for a viewer that
 * cannot ask the media route: a public link's visitor has no session.
 */
export function viewerDeck(bytes: ArrayBuffer | Uint8Array): Deck {
	const entries = readZip(bytes);
	const deck = readDeck(entries);
	const inline = (src: string) => mediaDataUrl(entries, src) ?? src;
	const fill = <T extends Fill | undefined>(value: T): T =>
		value?.type === "image"
			? ({ ...value, src: inline(value.src) } as T)
			: value;
	const element = (item: SlideElement): SlideElement => {
		switch (item.kind) {
			case "image":
				return { ...item, src: inline(item.src) };
			case "group":
				return { ...item, children: item.children.map(element) };
			case "shape":
				return { ...item, fill: fill(item.fill) };
			default:
				return item.preview
					? { ...item, preview: element(item.preview) }
					: item;
		}
	};
	return {
		...deck,
		masters: deck.masters.map((master) => ({
			...master,
			background: fill(master.background),
			elements: master.elements.map(element),
		})),
		layouts: deck.layouts.map((layout) => ({
			...layout,
			background: fill(layout.background),
			elements: layout.elements.map(element),
		})),
		slides: deck.slides.map((slide) => ({
			...slide,
			background: fill(slide.background),
			elements: slide.elements.map(element),
		})),
	};
}
