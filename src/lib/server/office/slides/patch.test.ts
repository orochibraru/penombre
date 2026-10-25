import { describe, expect, it } from "bun:test";

import type { SlideElement, TextBody } from "#lib/slides/model.js";

import { element, parseXml, serializeNode, type XmlElement } from "../xml";
import {
	boxOf,
	dropDanglingTiming,
	invert,
	mergeLine,
	nvProperties,
	patchText,
	sameBox,
	setSlot,
	withoutIds,
} from "./patch";

const parse = (xml: string): XmlElement => parseXml(xml).root;
const names = (node: XmlElement) =>
	node.children.map((child) => (child.type === "element" ? child.name : "#"));

function body(overrides: Partial<TextBody> = {}): TextBody {
	return {
		paragraphs: [{ runs: [{ text: "one" }] }],
		anchor: "t",
		inset: [91_440, 45_720, 91_440, 45_720],
		wrap: true,
		autofit: "none",
		levels: [],
		...overrides,
	};
}

describe("setSlot", () => {
	it("puts a child in its slot of the sequence, replacing the old one", () => {
		const spPr = parse(
			"<p:spPr><a:xfrm/><a:solidFill/><a:ln/><a:extLst/></p:spPr>",
		);
		setSlot(spPr, element("a:prstGeom", { prst: "rect" }), 1);
		expect(names(spPr)).toEqual([
			"a:xfrm",
			"a:prstGeom",
			"a:solidFill",
			"a:ln",
			"a:extLst",
		]);
		setSlot(spPr, element("a:noFill"), 2);
		expect(names(spPr)).toEqual([
			"a:xfrm",
			"a:prstGeom",
			"a:noFill",
			"a:ln",
			"a:extLst",
		]);
	});

	it("appends when nothing later is there, and removes on null", () => {
		const spPr = parse("<p:spPr><a:xfrm/><a:ln/></p:spPr>");
		setSlot(spPr, element("a:effectLst"), 4);
		expect(names(spPr)).toEqual(["a:xfrm", "a:ln", "a:effectLst"]);
		setSlot(spPr, null, 3);
		expect(names(spPr)).toEqual(["a:xfrm", "a:effectLst"]);
	});

	it("takes another order", () => {
		const parent = parse("<x><b/></x>");
		setSlot(parent, element("a"), 0, [["a"], ["b"]]);
		expect(names(parent)).toEqual(["a", "b"]);
	});
});

describe("boxes", () => {
	it("compares positions rounded, and rotation and flips exactly", () => {
		const box = { x: 10.2, y: 20, w: 30, h: 40 };
		expect(sameBox(box, { ...box, x: 9.8 })).toBe(true);
		expect(sameBox(box, { ...box, rot: 0, flipH: false })).toBe(true);
		expect(sameBox(box, { ...box, x: 11 })).toBe(false);
		expect(sameBox(box, { ...box, rot: 90 })).toBe(false);
		expect(sameBox(box, { ...box, flipV: true })).toBe(false);
	});

	it("keeps only the box of an element", () => {
		const shape = {
			id: "7",
			kind: "shape",
			x: 1,
			y: 2,
			w: 3,
			h: 4,
			rot: 45,
			flipH: true,
		} as unknown as SlideElement;
		expect(boxOf(shape)).toEqual({
			x: 1,
			y: 2,
			w: 3,
			h: 4,
			rot: 45,
			flipH: true,
			flipV: undefined,
		});
	});

	it("inverts a scale and a shift", () => {
		const toSlide = (box: { x: number; y: number; w: number; h: number }) => ({
			...box,
			x: box.x * 2 + 100,
			y: box.y * 4 + 50,
			w: box.w * 2,
			h: box.h * 4,
		});
		const toChild = invert(toSlide);
		const child = { x: 10, y: 20, w: 30, h: 40, rot: 5 };
		expect(toChild(toSlide(child))).toEqual(child);
	});

	it("treats a degenerate map as no scale", () => {
		const toChild = invert((box) => ({ ...box, x: box.x + 5, w: 0, h: 0 }));
		expect(toChild({ x: 15, y: 0, w: 8, h: 6 })).toEqual({
			x: 10,
			y: 0,
			w: 8,
			h: 6,
		});
	});
});

describe("withoutIds", () => {
	it("drops ids at every depth of a group", () => {
		const group = {
			id: "1",
			kind: "group",
			children: [
				{ id: "2", kind: "raw", xml: "<a/>" },
				{ id: "3", kind: "group", children: [{ id: "4", kind: "raw" }] },
			],
		} as unknown as SlideElement;
		expect(withoutIds(group)).toEqual({
			kind: "group",
			children: [
				{ kind: "raw", xml: "<a/>" },
				{ kind: "group", children: [{ kind: "raw" }] },
			],
		});
	});
});

describe("nvProperties", () => {
	it("finds cNvPr under whichever non-visual block the node has", () => {
		const picture = parse(
			'<p:pic><p:nvPicPr><p:cNvPr id="5" name="Picture"/></p:nvPicPr></p:pic>',
		);
		expect(nvProperties(picture)?.attrs.id).toBe("5");
		expect(nvProperties(parse("<p:sp><p:spPr/></p:sp>"))).toBeUndefined();
	});
});

describe("mergeLine", () => {
	it("is the new outline when there was none", () => {
		const next = element("a:ln", { w: "12700" });
		expect(mergeLine(undefined, next)).toBe(next);
	});

	it("keeps unknown children and attributes, in schema order", () => {
		const own = parse(
			'<a:ln w="9525" cmpd="dbl"><a:solidFill/><a:miter lim="800000"/><a:tailEnd type="arrow"/></a:ln>',
		);
		const next = element("a:ln", { w: "25400", cap: undefined }, [
			element("a:tailEnd", { type: "none" }),
			element("a:round"),
			element("a:noFill"),
		]);
		expect(serializeNode(mergeLine(own, next))).toBe(
			'<a:ln w="25400" cmpd="dbl"><a:noFill/><a:miter lim="800000"/><a:tailEnd type="none"/></a:ln>',
		);
	});

	it("keeps the model's round join when the old line had no other", () => {
		const own = parse("<a:ln><a:custDash/><a:extLst/></a:ln>");
		const next = element("a:ln", {}, [
			element("a:headEnd"),
			element("a:round"),
			element("a:prstDash", { val: "dash" }),
		]);
		expect(names(mergeLine(own, next))).toEqual([
			"a:prstDash",
			"a:custDash",
			"a:round",
			"a:headEnd",
			"a:extLst",
		]);
	});

	it("puts names it does not know last", () => {
		const own = parse("<a:ln><a:mystery/></a:ln>");
		const next = element("a:ln", {}, [element("a:solidFill")]);
		expect(names(mergeLine(own, next))).toEqual(["a:solidFill", "a:mystery"]);
	});
});

describe("dropDanglingTiming", () => {
	const slide = (target: string) =>
		parse(
			`<p:sld><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2"/></p:nvSpPr></p:sp></p:spTree></p:cSld><p:timing><p:spTgt spid="${target}"/></p:timing></p:sld>`,
		);

	it("keeps animations whose shapes are all there", () => {
		const root = slide("2");
		dropDanglingTiming(root);
		expect(names(root)).toEqual(["p:cSld", "p:timing"]);
	});

	it("drops the timing when one names a shape that is gone", () => {
		const root = slide("9");
		dropDanglingTiming(root);
		expect(names(root)).toEqual(["p:cSld"]);
	});

	it("does nothing without a timing", () => {
		const root = parse("<p:sld><p:cSld/></p:sld>");
		dropDanglingTiming(root);
		expect(names(root)).toEqual(["p:cSld"]);
	});
});

describe("patchText", () => {
	const shape = (inner: string) =>
		parse(`<p:sp><p:nvSpPr/><p:spPr/>${inner}<p:extLst/></p:sp>`);
	const existing =
		'<p:txBody><a:bodyPr anchor="t" rot="0"><a:prstTxWarp prst="textNoShape"/></a:bodyPr><a:lstStyle/><a:p><a:r><a:t>one</a:t></a:r></a:p><a:p><a:r><a:t>two</a:t></a:r></a:p></p:txBody>';

	it("removes the text body when the model has none", () => {
		const node = shape(existing);
		patchText(node, body(), undefined);
		expect(names(node)).toEqual(["p:nvSpPr", "p:spPr", "p:extLst"]);
	});

	it("writes a whole body before extLst when there was none", () => {
		const node = shape("");
		patchText(node, undefined, body());
		expect(names(node)).toEqual(["p:nvSpPr", "p:spPr", "p:txBody", "p:extLst"]);
		const fresh = parse("<p:sp/>");
		patchText(fresh, undefined, body());
		expect(names(fresh)).toEqual(["p:txBody"]);
	});

	it("keeps unchanged paragraphs and settings byte for byte", () => {
		const before = body({
			paragraphs: [{ runs: [{ text: "one" }] }, { runs: [{ text: "two" }] }],
		});
		const node = shape(existing);
		patchText(node, before, {
			...before,
			paragraphs: [{ runs: [{ text: "one" }] }, { runs: [{ text: "deux" }] }],
		});
		const xml = serializeNode(node);
		expect(xml).toContain(
			'<a:bodyPr anchor="t" rot="0"><a:prstTxWarp prst="textNoShape"/></a:bodyPr><a:lstStyle/><a:p><a:r><a:t>one</a:t></a:r></a:p>',
		);
		expect(xml).toContain("deux");
		expect(xml).not.toContain("two");
	});

	it("rewrites only the box settings that changed", () => {
		const before = body();
		const node = shape(existing);
		patchText(node, before, {
			...before,
			anchor: "ctr",
			wrap: false,
			inset: [0, 45_720, 91_440.4, 45_720],
		});
		const bodyPr = serializeNode(
			(node.children[2] as XmlElement).children[0] as XmlElement,
		);
		expect(bodyPr).toBe(
			'<a:bodyPr anchor="ctr" rot="0" wrap="none" lIns="0" rIns="91440"><a:prstTxWarp prst="textNoShape"/></a:bodyPr>',
		);
	});

	it("puts a new autofit after the warp, or in place of the old one", () => {
		const before = body();
		const node = shape(existing);
		patchText(node, before, {
			...before,
			autofit: "shrink",
			fontScale: 0.9,
			lineReduction: 0.1,
		});
		const bodyPr = (node.children[2] as XmlElement).children[0] as XmlElement;
		expect(serializeNode(bodyPr)).toBe(
			'<a:bodyPr anchor="t" rot="0"><a:prstTxWarp prst="textNoShape"/><a:normAutofit fontScale="90000" lnSpcReduction="10000"/></a:bodyPr>',
		);

		const shrunk = {
			...before,
			autofit: "shrink" as const,
			fontScale: 0.9,
			lineReduction: 0.1,
		};
		patchText(node, shrunk, { ...before, autofit: "resize" });
		expect(names(bodyPr)).toEqual(["a:prstTxWarp", "a:spAutoFit"]);
		patchText(node, { ...before, autofit: "resize" }, before);
		expect(names(bodyPr)).toEqual(["a:prstTxWarp", "a:noAutofit"]);
	});

	it("puts an autofit first when there is no warp", () => {
		const node = shape(
			"<p:txBody><a:bodyPr><a:scene3d/></a:bodyPr><a:p/></p:txBody>",
		);
		const before = body({ paragraphs: [{ runs: [] }] });
		patchText(node, before, { ...before, autofit: "resize" });
		const bodyPr = (node.children[2] as XmlElement).children[0] as XmlElement;
		expect(names(bodyPr)).toEqual(["a:spAutoFit", "a:scene3d"]);
	});
});
