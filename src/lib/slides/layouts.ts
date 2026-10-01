import {
	type Deck,
	flatten,
	type Layout,
	nextElementId,
	type Paragraph,
	randomKey,
	type ShapeElement,
	type Slide,
	type SlideElement,
} from "./model";
import { kindOfLayoutName, type LayoutKind, templateDeck } from "./templates";

/**
 * Slides made from layouts, and a deck moved onto another template.
 */

/** How a placeholder is addressed when filling one: `title`, `sub`, or its idx. */
export function placeholderKey(element: SlideElement): string {
	const type = element.placeholder?.type;
	if (type === "title" || type === "ctrTitle") {
		return "title";
	}
	if (type === "subTitle") {
		return "sub";
	}
	return element.placeholder?.idx ?? type ?? "";
}

function paragraphs(lines: string[] | undefined): Paragraph[] {
	if (!lines || lines.length === 0) {
		return [{ runs: [] }];
	}
	return lines.map((line) => ({ runs: line === "" ? [] : [{ text: line }] }));
}

/**
 * A new slide on a layout: its placeholders, empty or filled from
 * `content` by `placeholderKey`, and nothing else.
 */
export function slideFromLayout(
	layout: Layout,
	content: Record<string, string[]> = {},
): Slide {
	let id = 2;
	const elements = layout.placeholders.map((source): SlideElement => {
		const copy = structuredClone(source) as SlideElement;
		copy.id = String(id++);
		copy.origin = undefined;
		if (copy.kind === "shape" && copy.text) {
			copy.text.paragraphs = paragraphs(content[placeholderKey(copy)]);
		}
		return copy;
	});
	return {
		id: randomKey(),
		layout: layout.part,
		notes: "",
		elements,
	};
}

/** Which layout of our templates a layout plays the part of. */
export function layoutKind(layout: Layout | undefined): LayoutKind | undefined {
	if (!layout) {
		return undefined;
	}
	const named = kindOfLayoutName(layout.name);
	if (named) {
		return named;
	}
	const byType: Record<string, LayoutKind> = {
		title: "title",
		secHead: "section",
		obj: "content",
		tx: "content",
		titleOnly: "content",
		twoObj: "two",
		twoTxTwoObj: "comparison",
		picTx: "picture",
		blank: "blank",
	};
	return byType[layout.type];
}

/** The layout a slide should move to on another template. */
function matchingLayout(
	target: Deck,
	source: Layout | undefined,
): Layout | undefined {
	const kind = layoutKind(source) ?? "content";
	return (
		target.layouts.find((layout) => layoutKind(layout) === kind) ??
		target.layouts[0]
	);
}

/**
 * Carry a placeholder's geometry and text styles over from the new layout,
 * so a slide re-flows into the new theme instead of keeping the old one's
 * boxes. Text the user wrote stays.
 */
function adopt(element: SlideElement, layout: Layout): SlideElement {
	if (element.kind !== "shape" || !element.placeholder) {
		return element;
	}
	const key = placeholderKey(element);
	const match = layout.placeholders.find(
		(candidate): candidate is ShapeElement =>
			candidate.kind === "shape" && placeholderKey(candidate) === key,
	);
	if (!match) {
		return element;
	}
	return {
		...element,
		// title and ctrTitle match in PowerPoint, not in LibreOffice: take the layout's.
		placeholder: match.placeholder
			? { ...match.placeholder }
			: element.placeholder,
		x: match.x,
		y: match.y,
		w: match.w,
		h: match.h,
		rot: match.rot,
		text:
			element.text && match.text
				? {
						...element.text,
						anchor: match.text.anchor,
						levels: match.text.levels,
					}
				: element.text,
	};
}

function isEmpty(element: SlideElement): boolean {
	return (
		element.kind === "shape" &&
		!element.text?.paragraphs.some((paragraph) =>
			paragraph.runs.some((run) => run.text !== ""),
		)
	);
}

/**
 * A slide moved onto another layout: its placeholders take the new
 * layout's places and styles, empty ones the layout lacks go, and the ones
 * it adds appear empty. Nothing the user wrote or placed is dropped.
 */
export function relayout(slide: Slide, layout: Layout): Slide {
	const keys = new Set(layout.placeholders.map(placeholderKey));
	const kept = slide.elements
		.filter(
			(element) =>
				!element.placeholder ||
				!isEmpty(element) ||
				keys.has(placeholderKey(element)),
		)
		.map((element) => adopt(element, layout));
	const present = new Set(
		flatten(kept)
			.filter((element) => element.placeholder)
			.map(placeholderKey),
	);
	const fresh = slideFromLayout(layout).elements.filter(
		(element) => !present.has(placeholderKey(element)),
	);
	let next = Number(nextElementId(kept));
	return {
		...slide,
		layout: layout.part,
		elements: [
			...kept,
			...fresh.map((element) => ({ ...element, id: String(next++) })),
		],
	};
}

/**
 * The deck on another template: its master and layouts replaced, every
 * slide moved to the equivalent layout. Returns null for an unknown id.
 */
export function applyTemplate(deck: Deck, id: string): Deck | null {
	const target = templateDeck(id);
	if (!target) {
		return null;
	}
	const slides = deck.slides.map((slide) => {
		const layout = matchingLayout(
			target,
			deck.layouts.find((candidate) => candidate.part === slide.layout),
		);
		return layout ? relayout(slide, layout) : slide;
	});
	return {
		...deck,
		template: id,
		masters: target.masters,
		layouts: target.layouts,
		slides,
	};
}
