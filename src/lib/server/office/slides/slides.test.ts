import { describe, expect, it } from "bun:test";
import { strokeShape } from "#lib/slides/ink.js";
import { applyTemplate, slideFromLayout } from "#lib/slides/layouts.js";
import type {
	Deck,
	GroupElement,
	ImageElement,
	RawElement,
	ShapeElement,
	SlideElement,
} from "#lib/slides/model.js";
import { TEMPLATE_IDS, templateDeck } from "#lib/slides/templates/index.js";
import { partText, readZip, writeZip, type ZipEntry } from "../zip";
import {
	readDeck,
	slidesPdfPages,
	templatePackage,
	viewerDeck,
	writeDeck,
} from "./index";
import { deckWith, PIXEL, PIXEL_URL, packageProblems, sp } from "./test-utils";

const clone = <T>(value: T): T => structuredClone(value);

/** Read, change, write back, and hand over both the new package and its model. */
function edit(entries: ZipEntry[], change: (deck: Deck) => void): Deck {
	const deck = clone(readDeck(entries));
	change(deck);
	writeDeck(entries, JSON.parse(JSON.stringify(deck)) as Deck);
	expect(packageProblems(entries)).toEqual([]);
	return readDeck(entries);
}

const first = (deck: Deck) => deck.slides[0]?.elements ?? [];
const slideXml = (entries: ZipEntry[], n = 1) =>
	partText(entries, `ppt/slides/slide${n}.xml`) ?? "";

describe("templates", () => {
	it.each(TEMPLATE_IDS)("%s writes a package with nothing to repair", (id) => {
		const bytes = templatePackage(id, "Hello");
		expect(bytes).not.toBeNull();
		const entries = readZip(bytes as Buffer);
		expect(packageProblems(entries)).toEqual([]);
		const deck = readDeck(entries);
		expect(deck.template).toBe(id);
		expect(deck.layouts).toHaveLength(11);
		const title = first(deck)[0] as ShapeElement;
		expect(title.text?.paragraphs[0]?.runs[0]?.text).toBe("Hello");
	});

	it("reads back the layouts the editor previews", () => {
		const entries = readZip(templatePackage("paper", "x") as Buffer);
		const read = readDeck(entries);
		const preview = templateDeck("paper") as Deck;
		const strip = (element: SlideElement) => ({
			...element,
			id: "",
			name: "",
			origin: undefined,
		});
		for (const [index, layout] of preview.layouts.entries()) {
			const actual = read.layouts[index];
			expect(actual?.name).toBe(layout.name);
			expect(actual?.placeholders.map(strip)).toEqual(
				JSON.parse(JSON.stringify(layout.placeholders.map(strip))),
			);
		}
	});

	it("gives the title slide's placeholders the layout's box and style", () => {
		const deck = readDeck(readZip(templatePackage("bold", "x") as Buffer));
		const title = first(deck)[0] as ShapeElement;
		expect(title.x).toBe(80 * 12_700);
		expect(title.text?.levels[0]?.size).toBe(54);
		expect(title.text?.anchor).toBe("b");
		// Written as inheriting: no transform of its own on the slide.
		expect(slideXml(readZip(templatePackage("bold", "x") as Buffer))).toContain(
			"<p:spPr/>",
		);
	});
});

describe("reading", () => {
	it("resolves a theme style reference into a fill and an outline", () => {
		const style =
			'<p:style><a:lnRef idx="2"><a:schemeClr val="accent1"/></a:lnRef><a:fillRef idx="1"><a:schemeClr val="accent2"/></a:fillRef><a:effectRef idx="0"><a:schemeClr val="accent1"/></a:effectRef><a:fontRef idx="minor"><a:schemeClr val="lt1"/></a:fontRef></p:style>';
		const shape = first(readDeck(deckWith(sp(5, style))))[0] as ShapeElement;
		expect(shape.fill).toEqual({ type: "solid", color: { scheme: "accent2" } });
		expect(shape.line.width).toBe(12_700);
		expect(shape.line.fill).toEqual({
			type: "solid",
			color: { scheme: "accent1" },
		});
	});

	it("maps a group's children through its child offset and extent", () => {
		const group = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="9" name="G"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="1000" y="1000"/><a:ext cx="2000" cy="2000"/><a:chOff x="0" y="0"/><a:chExt cx="1000" cy="1000"/></a:xfrm></p:grpSpPr>${sp(10).replace('<a:off x="100" y="200"/><a:ext cx="3000" cy="4000"/>', '<a:off x="500" y="0"/><a:ext cx="500" cy="500"/>')}</p:grpSp>`;
		const read = first(readDeck(deckWith(group)))[0] as GroupElement;
		expect(read.kind).toBe("group");
		expect(read.children[0]).toMatchObject({
			x: 2000,
			y: 1000,
			w: 1000,
			h: 1000,
		});
	});

	it("keeps a table, a chart and PowerPoint ink as things to show and move", () => {
		const table =
			'<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="Table"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="0"/><a:ext cx="1000" cy="500"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblGrid><a:gridCol w="500"/><a:gridCol w="500"/></a:tblGrid><a:tr h="250"><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>A</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>B</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
		const ink =
			'<mc:AlternateContent><mc:Choice Requires="p14"><p:contentPart p14:bwMode="auto" r:id="rId7"><p14:nvContentPartPr><p14:cNvPr id="6" name="Ink 5"/><p14:cNvContentPartPr/><p14:nvPr/></p14:nvContentPartPr><p14:xfrm><a:off x="10" y="10"/><a:ext cx="90" cy="90"/></p14:xfrm></p:contentPart></mc:Choice><mc:Fallback><p:pic><p:nvPicPr><p:cNvPr id="6" name="Ink 5"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId8"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="10" y="10"/><a:ext cx="90" cy="90"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></mc:Fallback></mc:AlternateContent>';
		const entries = deckWith(
			table + ink,
			'<Relationship Id="rId7" Type="http://schemas.microsoft.com/office/2011/relationships/inkPart" Target="../ink/ink1.xml"/><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>',
			{
				"ppt/ink/ink1.xml": new TextEncoder().encode("<inkml:ink/>"),
				"ppt/media/image1.png": PIXEL,
			},
		);
		const [frame, alternate] = first(readDeck(entries)) as RawElement[];
		expect(frame?.label).toBe("table");
		expect(frame?.table?.rows[0]?.cells.map((cell) => cell.text)).toEqual([
			"A",
			"B",
		]);
		expect(alternate?.kind).toBe("raw");
		expect(alternate?.preview?.kind).toBe("image");
	});
});

describe("writing", () => {
	it("leaves a slide nobody touched exactly as it was", () => {
		const entries = deckWith(
			sp(
				5,
				"",
				'<a:effectLst><a:glow rad="1"/></a:effectLst>',
				"<a:p><a:r><a:t>Hi</a:t></a:r></a:p>",
			),
		);
		const before = slideXml(entries);
		writeDeck(entries, JSON.parse(JSON.stringify(readDeck(entries))) as Deck);
		expect(slideXml(entries).replace(/<p:grpSpPr\/>/, "")).toBe(
			before.replace(/<p:grpSpPr\/>/, ""),
		);
	});

	it("patches only the transform of a shape that moved", () => {
		const entries = deckWith(
			sp(5, "", '<a:effectLst><a:glow rad="1"/></a:effectLst>'),
		);
		const after = edit(entries, (deck) => {
			const shape = first(deck)[0] as ShapeElement;
			shape.x = 5000;
		});
		expect(first(after)[0]?.x).toBe(5000);
		expect(slideXml(entries)).toContain('<a:off x="5000" y="200"/>');
		expect(slideXml(entries)).toContain('<a:glow rad="1"/>');
	});

	it("rewrites only the paragraph that changed", () => {
		const text =
			'<a:p><a:r><a:rPr lang="fr-FR" sz="2400"/><a:t>one</a:t></a:r></a:p><a:p><a:r><a:rPr><a:hlinkClick r:id="rId5"/></a:rPr><a:t>link</a:t></a:r></a:p>';
		const entries = deckWith(
			sp(5, "", "", text),
			'<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com" TargetMode="External"/>',
		);
		edit(entries, (deck) => {
			const shape = first(deck)[0] as ShapeElement;
			const run = shape.text?.paragraphs[0]?.runs[0];
			if (run) {
				run.text = "uno";
				run.bold = true;
			}
		});
		const xml = slideXml(entries);
		expect(xml).toContain("<a:t>uno</a:t>");
		expect(xml).toContain('b="1"');
		expect(xml).toContain('<a:hlinkClick r:id="rId5"/>');
	});

	it("stores a drawing as a custom path and reads it back", () => {
		const entries = deckWith("");
		const pen = { color: { rgb: "FF0000" }, width: 38_100, highlighter: false };
		const stroke = strokeShape(
			[
				[0, 0],
				[100_000, 50_000],
				[200_000, 0],
				[300_000, 80_000],
			],
			pen,
			"7",
		);
		const after = edit(entries, (deck) => {
			deck.slides[0]?.elements.push(stroke);
		});
		const read = first(after)[0] as ShapeElement;
		expect(slideXml(entries)).toContain("<a:custGeom>");
		expect(slideXml(entries)).toContain("a:cubicBezTo");
		expect(read.geometry).toEqual(stroke.geometry);
		expect(read.line.width).toBe(38_100);
		expect(read.fill).toEqual({ type: "none" });
	});

	it("embeds a new picture once, and drops media nothing uses", () => {
		const entries = deckWith("");
		const picture = (id: string): ImageElement => ({
			kind: "image",
			id,
			x: 0,
			y: 0,
			w: 100,
			h: 100,
			src: PIXEL_URL,
		});
		const after = edit(entries, (deck) => {
			deck.slides[0]?.elements.push(picture("5"), picture("6"));
		});
		const media = entries.filter((entry) =>
			entry.name.startsWith("ppt/media/"),
		);
		expect(media).toHaveLength(1);
		expect((first(after)[0] as ImageElement).src).toBe(
			media[0]?.name as string,
		);
		edit(entries, (deck) => {
			const slide = deck.slides[0];
			if (slide) {
				slide.elements = [];
			}
		});
		expect(entries.some((entry) => entry.name.startsWith("ppt/media/"))).toBe(
			false,
		);
	});

	it("keeps what it cannot edit, and moves it", () => {
		const frame =
			'<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="Chart"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="0"/><a:ext cx="1000" cy="500"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId3"/></a:graphicData></a:graphic></p:graphicFrame>';
		const entries = deckWith(
			frame,
			'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>',
			{ "ppt/charts/chart1.xml": new TextEncoder().encode("<c:chartSpace/>") },
		);
		edit(entries, (deck) => {
			const chart = first(deck)[0] as RawElement;
			chart.x = 7000;
		});
		const xml = slideXml(entries);
		expect(xml).toContain(
			'<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId3"/>',
		);
		expect(xml).toContain('<p:xfrm><a:off x="7000" y="0"/>');
	});

	it("duplicates a slide into a new part with its own relationships", () => {
		const pic =
			'<p:pic><p:nvPicPr><p:cNvPr id="5" name="P"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId4"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="10" cy="10"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
		const entries = deckWith(
			pic,
			'<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>',
			{ "ppt/media/image1.png": PIXEL },
		);
		const after = edit(entries, (deck) => {
			const slide = deck.slides[0];
			if (slide) {
				deck.slides.push({ ...clone(slide), id: "copy" });
			}
		});
		expect(after.slides).toHaveLength(2);
		expect(after.slides[1]?.source).not.toBe(after.slides[0]?.source);
		expect(
			(after.slides[1]?.elements[0] as ImageElement | undefined)?.src,
		).toBe("ppt/media/image1.png");
	});

	it("reorders, hides and deletes slides", () => {
		const entries = readZip(templatePackage("swiss", "One") as Buffer);
		edit(entries, (deck) => {
			const layout = deck.layouts[2];
			if (layout) {
				deck.slides.push(slideFromLayout(layout, { title: ["Two"] }));
				deck.slides.push(slideFromLayout(layout, { title: ["Three"] }));
			}
		});
		const titles = (deck: Deck) =>
			deck.slides.map(
				(slide) =>
					(slide.elements[0] as ShapeElement).text?.paragraphs[0]?.runs[0]
						?.text,
			);
		const after = edit(entries, (deck) => {
			deck.slides.reverse();
			deck.slides.splice(1, 1);
			const last = deck.slides[1];
			if (last) {
				last.hidden = true;
			}
		});
		expect(titles(after)).toEqual(["Three", "One"]);
		expect(after.slides[1]?.hidden).toBe(true);
		expect(
			entries.filter((entry) =>
				/^ppt\/slides\/slide\d+\.xml$/.test(entry.name),
			),
		).toHaveLength(2);
		expect(slidesPdfPages(writeZip(entries))).toHaveLength(1);
	});

	it("keeps shape ids unique when a paste brings a taken one", () => {
		const entries = deckWith(sp(5));
		edit(entries, (deck) => {
			const shape = first(deck)[0] as ShapeElement;
			deck.slides[0]?.elements.push({ ...clone(shape), origin: undefined });
		});
		const ids = [...slideXml(entries).matchAll(/<p:cNvPr id="(\d+)"/g)].map(
			(match) => match[1],
		);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("writes a new group in its own coordinates and ungroups a scaled one", () => {
		const entries = deckWith(sp(5) + sp(6).replace('x="100"', 'x="9000"'));
		const grouped = edit(entries, (deck) => {
			const slide = deck.slides[0];
			if (slide) {
				const [a, b] = slide.elements;
				slide.elements = [
					{
						kind: "group",
						id: "20",
						x: 100,
						y: 200,
						w: 11_900,
						h: 4000,
						children: [a, b] as SlideElement[],
					},
				];
			}
		});
		const group = first(grouped)[0] as GroupElement;
		expect(group.children.map((child) => child.x)).toEqual([100, 9000]);
		const scaled = edit(entries, (deck) => {
			const g = first(deck)[0] as GroupElement;
			g.w *= 2;
			for (const child of g.children) {
				child.x = 100 + (child.x - 100) * 2;
				child.w *= 2;
			}
		});
		expect(
			(first(scaled)[0] as GroupElement).children.map((child) => child.x),
		).toEqual([100, 17_900]);
	});

	it("drops an animation whose shape is gone, keeps one whose shape is not", () => {
		const timing = (id: number) =>
			`<p:timing><p:tnLst><p:par><p:cTn id="1"><p:childTnLst><p:set><p:cBhvr><p:cTn id="2"/><p:tgtEl><p:spTgt spid="${id}"/></p:tgtEl></p:cBhvr></p:set></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
		const entries = deckWith(sp(5) + sp(6));
		const withTiming = (id: number) =>
			entries.forEach((entry) => {
				if (entry.name === "ppt/slides/slide1.xml") {
					entry.data = new TextEncoder().encode(
						new TextDecoder()
							.decode(entry.data)
							.replace("</p:clrMapOvr>", `</p:clrMapOvr>${timing(id)}`),
					);
				}
			});
		withTiming(6);
		edit(entries, (deck) => {
			const shape = first(deck)[0];
			if (shape) {
				shape.x += 10;
			}
		});
		expect(slideXml(entries)).toContain("<p:timing>");
		edit(entries, (deck) => {
			deck.slides[0]?.elements.pop();
		});
		expect(slideXml(entries)).not.toContain("<p:timing>");
	});

	it("switches a deck to another template and re-flows its placeholders", () => {
		const entries = readZip(templatePackage("swiss", "Deck") as Buffer);
		const after = edit(entries, (deck) => {
			Object.assign(deck, applyTemplate(deck, "noir"));
		});
		expect(after.template).toBe("noir");
		expect(after.masters).toHaveLength(1);
		expect(after.masters[0]?.theme.fonts.heading).toBe("Georgia");
		const title = first(after)[0] as ShapeElement;
		expect(title.text?.levels[0]?.align).toBe("ctr");
		expect(title.text?.paragraphs[0]?.runs[0]?.text).toBe("Deck");
	});
});

describe("speaker notes", () => {
	it("get a notes page, and keep it when the slide is reused", () => {
		const entries = readZip(templatePackage("pastel", "N") as Buffer);
		const after = edit(entries, (deck) => {
			const slide = deck.slides[0];
			if (slide) {
				slide.notes = "Say hello\nThen go";
			}
		});
		expect(after.slides[0]?.notes).toBe("Say hello\nThen go");
		expect(partText(entries, "[Content_Types].xml")).toContain(
			"notesSlide1.xml",
		);
	});

	it("are not shared with a copy, and leave with their slide", () => {
		const entries = readZip(templatePackage("pastel", "N") as Buffer);
		edit(entries, (deck) => {
			const slide = deck.slides[0];
			if (slide) {
				slide.notes = "mine";
				deck.slides.push({ ...clone(slide), id: "copy", notes: "" });
			}
		});
		const after = readDeck(entries);
		expect(after.slides.map((slide) => slide.notes)).toEqual(["mine", ""]);
		edit(entries, (deck) => {
			deck.slides.shift();
		});
		expect(entries.some((entry) => entry.name.includes("notesSlide"))).toBe(
			false,
		);
	});
});

describe("PDF pages", () => {
	it("draws each shown slide as an SVG with its text and pictures inlined", () => {
		const entries = readZip(templatePackage("midnight", "A & B") as Buffer);
		edit(entries, (deck) => {
			deck.slides[0]?.elements.push({
				kind: "image",
				id: "9",
				x: 0,
				y: 0,
				w: 100,
				h: 100,
				src: PIXEL_URL,
			});
		});
		const [page] = slidesPdfPages(writeZip(entries));
		expect(page).toStartWith("<svg");
		expect(page).toContain("&amp;");
		expect(page).toContain("data:image/png;base64,");
	});
});

describe("slides made in the editor", () => {
	it("land in the part the editor named, so the next save finds them", () => {
		const entries = readZip(templatePackage("swiss", "One") as Buffer);
		const deck = clone(readDeck(entries));
		const layout = deck.layouts[2];
		if (!layout) {
			throw new Error("no layout");
		}
		deck.slides.push({
			...slideFromLayout(layout, { title: ["Two"] }),
			source: "ppt/slides/slide7.xml",
		});
		writeDeck(entries, clone(deck));
		writeDeck(entries, clone(deck));
		expect(packageProblems(entries)).toEqual([]);
		expect(readDeck(entries).slides.map((slide) => slide.source)).toEqual([
			"ppt/slides/slide1.xml",
			"ppt/slides/slide7.xml",
		]);
	});
});

describe("a deck for a public link", () => {
	it("carries its pictures inline", () => {
		const entries = readZip(templatePackage("noir", "Pics") as Buffer);
		edit(entries, (deck) => {
			deck.slides[0]?.elements.push({
				kind: "image",
				id: "9",
				x: 0,
				y: 0,
				w: 10,
				h: 10,
				src: PIXEL_URL,
			});
		});
		expect((first(readDeck(entries))[2] as ImageElement).src).toStartWith(
			"ppt/media/",
		);
		const viewed = viewerDeck(writeZip(entries));
		expect((first(viewed)[2] as ImageElement).src).toBe(PIXEL_URL);
	});
});
