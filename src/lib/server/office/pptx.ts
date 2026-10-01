import type { Deck, SlideElement } from "#lib/slides/model.js";
import { NotAPresentationError } from "./pptx-package";
import { readDeck, writeDeck } from "./slides";
import type { ZipEntry } from "./zip";

/**
 * A deck as the slide editor speaks it — the model in `#lib/slides`, as
 * JSON — and back. The writing side patches the package in place: see
 * `slides/write.ts`.
 */

export function pptxToText(entries: ZipEntry[]): string {
	return JSON.stringify(readDeck(entries));
}

const KINDS = new Set(["shape", "image", "group", "raw"]);

function isElement(value: unknown): value is SlideElement {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const element = value as Record<string, unknown>;
	return (
		KINDS.has(String(element.kind)) &&
		typeof element.id === "string" &&
		["x", "y", "w", "h"].every((key) => Number.isFinite(element[key])) &&
		(element.kind !== "group" ||
			(Array.isArray(element.children) && element.children.every(isElement)))
	);
}

/** The editor's JSON, checked enough that a bad save cannot write a broken file. */
function parseDeck(text: string): Deck {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		throw new NotAPresentationError("The presentation is not valid JSON");
	}
	const deck = value as Partial<Deck>;
	const valid =
		Array.isArray(deck.slides) &&
		deck.slides.every(
			(slide) =>
				typeof slide === "object" &&
				slide !== null &&
				typeof slide.layout === "string" &&
				typeof slide.notes === "string" &&
				Array.isArray(slide.elements) &&
				slide.elements.every(isElement),
		);
	if (!valid) {
		throw new NotAPresentationError("The presentation is malformed");
	}
	return deck as Deck;
}

/** Apply an edited deck to the presentation, in place on `entries`. */
export function textToPptx(entries: ZipEntry[], text: string): void {
	writeDeck(entries, parseDeck(text));
}
