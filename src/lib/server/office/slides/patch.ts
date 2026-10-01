import type { Box, SlideElement, TextBody } from "#lib/slides/model.js";
import { sameValue } from "#lib/slides/model.js";
import {
	childNamed,
	childrenNamed,
	element,
	findElements,
	isElement,
	type XmlElement,
} from "../xml";
import { bodyPrNode, paragraphNode, txBodyNode } from "./generate";

/**
 * Surgery on existing XML: a child put in its slot of a schema sequence, an
 * outline or a text body rewritten only where the model changed.
 */

export type ToChild = (box: Box) => Box;

const SP_PR_ORDER = [
	["a:xfrm"],
	["a:custGeom", "a:prstGeom"],
	[
		"a:noFill",
		"a:solidFill",
		"a:gradFill",
		"a:blipFill",
		"a:pattFill",
		"a:grpFill",
	],
	["a:ln"],
	["a:effectLst", "a:effectDag"],
	["a:scene3d"],
	["a:sp3d"],
	["a:extLst"],
];

/** Put `child` in its slot of a sequence, replacing whatever held the slot. */
export function setSlot(
	parent: XmlElement,
	child: XmlElement | null,
	slot: number,
	order = SP_PR_ORDER,
): void {
	const names = new Set(order[slot]);
	const rank = (node: XmlElement) =>
		order.findIndex((group) => group.includes(node.name));
	parent.children = parent.children.filter(
		(node) => !isElement(node) || !names.has(node.name),
	);
	if (!child) {
		return;
	}
	const at = parent.children.findIndex(
		(node) => isElement(node) && rank(node) > slot,
	);
	if (at === -1) {
		parent.children.push(child);
	} else {
		parent.children.splice(at, 0, child);
	}
}

export function sameBox(a: Box, b: Box): boolean {
	return (
		Math.round(a.x) === Math.round(b.x) &&
		Math.round(a.y) === Math.round(b.y) &&
		Math.round(a.w) === Math.round(b.w) &&
		Math.round(a.h) === Math.round(b.h) &&
		(a.rot ?? 0) === (b.rot ?? 0) &&
		!!a.flipH === !!b.flipH &&
		!!a.flipV === !!b.flipV
	);
}

export function boxOf(element: Box): Box {
	return {
		x: element.x,
		y: element.y,
		w: element.w,
		h: element.h,
		rot: element.rot,
		flipH: element.flipH,
		flipV: element.flipV,
	};
}

/** The inverse of a child-to-slide mapping, which is a scale and a shift. */
export function invert(map: (box: Box) => Box): ToChild {
	const zero = map({ x: 0, y: 0, w: 0, h: 0 });
	const unit = map({ x: 0, y: 0, w: 1_000_000, h: 1_000_000 });
	const sx = unit.w / 1_000_000 || 1;
	const sy = unit.h / 1_000_000 || 1;
	return (box) => ({
		...box,
		x: (box.x - zero.x) / sx,
		y: (box.y - zero.y) / sy,
		w: box.w / sx,
		h: box.h / sy,
	});
}

export function withoutIds(value: SlideElement): unknown {
	const { id: _id, ...rest } = value;
	return rest.kind === "group"
		? { ...rest, children: rest.children.map(withoutIds) }
		: rest;
}

export function nvProperties(node: XmlElement): XmlElement | undefined {
	const nv = node.children.find(
		(child): child is XmlElement =>
			isElement(child) && child.name.startsWith("p:nv"),
	);
	return nv && childNamed(nv, "p:cNvPr");
}

const LINE_ORDER = [
	"a:noFill",
	"a:solidFill",
	"a:gradFill",
	"a:pattFill",
	"a:prstDash",
	"a:custDash",
	"a:round",
	"a:bevel",
	"a:miter",
	"a:headEnd",
	"a:tailEnd",
	"a:extLst",
];

function reorderLine(line: XmlElement): void {
	const rank = (name: string) => {
		const at = LINE_ORDER.indexOf(name);
		return at === -1 ? LINE_ORDER.length : at;
	};
	line.children = line.children
		.filter((child): child is XmlElement => isElement(child))
		.sort((a, b) => rank(a.name) - rank(b.name));
}

const INSETS = ["lIns", "tIns", "rIns", "bIns"] as const;

/** Rewrite only the text-box settings that changed, leaving the rest inherited. */
function patchBodyPr(
	bodyPr: XmlElement,
	before: TextBody,
	after: TextBody,
): void {
	if (before.anchor !== after.anchor) {
		bodyPr.attrs.anchor = after.anchor;
	}
	if (before.wrap !== after.wrap) {
		bodyPr.attrs.wrap = after.wrap ? "square" : "none";
	}
	INSETS.forEach((name, index) => {
		if (before.inset[index] !== after.inset[index]) {
			bodyPr.attrs[name] = String(Math.round(after.inset[index] ?? 0));
		}
	});
	if (
		before.autofit !== after.autofit ||
		before.fontScale !== after.fontScale ||
		before.lineReduction !== after.lineReduction
	) {
		const fresh = bodyPrNode({ ...after }, { ...after, autofit: "shrink" });
		const autofit = fresh.children[0] as XmlElement | undefined;
		const names = new Set(["a:normAutofit", "a:spAutoFit", "a:noAutofit"]);
		const at = bodyPr.children.findIndex(
			(child) => isElement(child) && names.has(child.name),
		);
		const replacement = autofit ?? element("a:noAutofit");
		if (at === -1) {
			const warp = bodyPr.children.findIndex(
				(child) => isElement(child) && child.name === "a:prstTxWarp",
			);
			bodyPr.children.splice(warp + 1, 0, replacement);
		} else {
			bodyPr.children[at] = replacement;
		}
	}
}

const LINE_KNOWN = new Set([
	"a:noFill",
	"a:solidFill",
	"a:gradFill",
	"a:pattFill",
	"a:prstDash",
	"a:headEnd",
	"a:tailEnd",
	"a:round",
]);

/** A new outline keeping what the model does not know of the old one: its join, its compound. */
export function mergeLine(
	own: XmlElement | undefined,
	next: XmlElement,
): XmlElement {
	if (!own) {
		return next;
	}
	const extra = own.children.filter(
		(child) => isElement(child) && !LINE_KNOWN.has(child.name),
	);
	next.attrs = {
		...own.attrs,
		...Object.fromEntries(
			Object.entries(next.attrs).filter(([, value]) => value !== undefined),
		),
	};
	if (
		extra.some(
			(child) =>
				isElement(child) &&
				(child.name === "a:bevel" || child.name === "a:miter"),
		)
	) {
		next.children = next.children.filter(
			(child) => !isElement(child) || child.name !== "a:round",
		);
	}
	next.children.push(...extra);
	reorderLine(next);
	return next;
}

/** Animations name shapes by id; one naming a shape that is gone breaks the file. */
export function dropDanglingTiming(root: XmlElement): void {
	const timing = childNamed(root, "p:timing");
	if (!timing) {
		return;
	}
	const ids = new Set(
		findElements(root, "p:cNvPr").map((node) => node.attrs.id),
	);
	if (
		findElements(timing, "p:spTgt").some(
			(target) => !ids.has(target.attrs.spid),
		)
	) {
		root.children = root.children.filter((child) => child !== timing);
	}
}

export function patchText(
	node: XmlElement,
	before: TextBody | undefined,
	after: TextBody | undefined,
	inherited?: TextBody,
): void {
	const existing = childNamed(node, "p:txBody");
	if (!after) {
		node.children = node.children.filter((child) => child !== existing);
		return;
	}
	if (!existing || !before) {
		const body = txBodyNode(after, inherited);
		node.children = node.children.filter((child) => child !== existing);
		const at = node.children.findIndex(
			(child) => isElement(child) && child.name === "p:extLst",
		);
		node.children.splice(at === -1 ? node.children.length : at, 0, body);
		return;
	}
	const settings = (body: TextBody) => [
		body.anchor,
		body.inset,
		body.wrap,
		body.autofit,
		body.fontScale,
		body.lineReduction,
	];
	const bodyPr = childNamed(existing, "a:bodyPr");
	if (bodyPr && !sameValue(settings(before), settings(after))) {
		patchBodyPr(bodyPr, before, after);
	}
	const originals = childrenNamed(existing, "a:p");
	const paragraphs = after.paragraphs.map((paragraph, index) => {
		const original = originals[index];
		return original && sameValue(before.paragraphs[index], paragraph)
			? original
			: paragraphNode(paragraph);
	});
	const head = existing.children.filter(
		(child) =>
			isElement(child) &&
			(child.name === "a:bodyPr" || child.name === "a:lstStyle"),
	);
	existing.children = [...head, ...paragraphs];
}
