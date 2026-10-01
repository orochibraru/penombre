import { translate } from "#lib/slides/edit.js";
import {
	nextElementId,
	type Slide,
	type SlideElement,
} from "#lib/slides/model.js";

/**
 * Copied slide elements: as JSON on the system clipboard, so they paste into
 * another tab or deck, and in memory for when the clipboard says no.
 */

const CLIPBOARD_KIND = "penombre-slides";

let clipboard: { file: string; elements: SlideElement[] } | null = null;

export function copyElements(
	file: string,
	elements: SlideElement[],
	data: DataTransfer | null,
): void {
	clipboard = { file, elements };
	data?.setData(
		"text/plain",
		JSON.stringify({ kind: CLIPBOARD_KIND, file, elements }),
	);
}

function payloadOf(text: string | undefined): typeof clipboard | false {
	if (!text) {
		return clipboard;
	}
	try {
		const parsed = JSON.parse(text) as {
			kind?: string;
			file?: string;
			elements?: SlideElement[];
		};
		return parsed.kind === CLIPBOARD_KIND && Array.isArray(parsed.elements)
			? { file: parsed.file ?? "", elements: parsed.elements }
			: false;
	} catch {
		return false;
	}
}

/**
 * The elements a paste puts on a slide, or null when the clipboard holds
 * none. From another file, an element's origin would name some other
 * file's XML, so it goes, and what only that file can draw stays behind.
 */
export function pastedElements(
	text: string | undefined,
	file: string,
	onSlide: SlideElement[],
): SlideElement[] | null {
	const payload = payloadOf(text);
	if (!payload) {
		return null;
	}
	const foreign = payload.file !== file;
	const strip = (item: SlideElement) => {
		if (foreign) {
			item.origin = undefined;
		}
		item.placeholder = undefined;
		if (item.kind === "group") {
			item.children.forEach(strip);
		}
	};
	return payload.elements
		.filter(
			(element) =>
				!foreign ||
				(element.kind !== "raw" &&
					(element.kind !== "image" || element.src.startsWith("data:"))),
		)
		.map((element) => {
			const copy = structuredClone(element);
			strip(copy);
			const taken = onSlide.some(
				(existing) => existing.x === copy.x && existing.y === copy.y,
			);
			return taken ? translate(copy, 12_700 * 12, 12_700 * 12) : copy;
		});
}

/** Give duplicate ids in a broken file fresh ones, so rendering can key by id. */
export function uniqueIds(slide: Slide): void {
	const seen = new Set<string>();
	const fix = (elements: SlideElement[]) => {
		for (const element of elements) {
			if (seen.has(element.id)) {
				element.id = nextElementId(slide.elements);
			}
			seen.add(element.id);
			if (element.kind === "group") {
				fix(element.children);
			}
		}
	};
	fix(slide.elements);
}
