import { describe, expect, test } from "bun:test";

import { degrees, PDFDocument } from "pdf-lib";

import {
	annotationsOn,
	describePdf,
	editPdf,
	PdfEditError,
	uprightPlacement,
} from "./pdf-edit";

/** A 1x1 transparent PNG. */
const PNG =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function formPdf(): Promise<Uint8Array> {
	const document = await PDFDocument.create();
	const first = document.addPage([600, 800]);
	const second = document.addPage([600, 800]);
	second.setRotation(degrees(90));
	const form = document.getForm();
	const name = form.createTextField("name");
	name.setText("Ada");
	name.addToPage(first, {
		x: 50,
		y: 700,
		width: 200,
		height: 24,
		borderWidth: 0,
	});
	const agree = form.createCheckBox("agree");
	agree.addToPage(first, { x: 50, y: 650, width: 16, height: 16 });
	const size = form.createRadioGroup("size");
	size.addOptionToPage("small", first, {
		x: 50,
		y: 600,
		width: 14,
		height: 14,
	});
	size.addOptionToPage("large", second, {
		x: 90,
		y: 600,
		width: 14,
		height: 14,
	});
	const city = form.createDropdown("city");
	city.addOptions(["Paris", "Lyon"]);
	city.addToPage(first, { x: 50, y: 550, width: 120, height: 20 });
	return await document.save();
}

describe("describePdf", () => {
	test("lists pages with their boxes and rotation", async () => {
		const layout = await describePdf(await formPdf());
		expect(layout.pages).toEqual([
			{ x: 0, y: 0, width: 600, height: 800, rotation: 0 },
			{ x: 0, y: 0, width: 600, height: 800, rotation: 90 },
		]);
	});

	test("lists every kind of field where it sits", async () => {
		const { fields } = await describePdf(await formPdf());
		const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
		expect(byName.name).toMatchObject({
			kind: "text",
			value: "Ada",
			widgets: [{ page: 0, rect: [50, 700, 200, 24], option: null }],
		});
		expect(byName.agree).toMatchObject({ kind: "checkbox", value: "false" });
		expect(byName.size).toMatchObject({
			kind: "radio",
			value: null,
			options: ["small", "large"],
			widgets: [
				{ page: 0, option: "small" },
				{ page: 1, option: "large" },
			],
		});
		expect(byName.city).toMatchObject({
			kind: "dropdown",
			options: ["Paris", "Lyon"],
		});
	});

	test("refuses what is not a PDF", async () => {
		await expect(
			describePdf(new TextEncoder().encode("not a pdf")),
		).rejects.toBeInstanceOf(PdfEditError);
	});
});

describe("editPdf", () => {
	test("fills fields and reads them back", async () => {
		const edited = await editPdf(await formPdf(), {
			fields: { name: "Grace", agree: "true", size: "large", city: "Lyon" },
		});
		const byName = Object.fromEntries(
			(await describePdf(edited)).fields.map((f) => [f.name, f.value]),
		);
		expect(byName).toEqual({
			name: "Grace",
			agree: "true",
			size: "large",
			city: "Lyon",
		});
	});

	test("refuses an unknown field or a value a field does not take", async () => {
		const pdf = await formPdf();
		await expect(
			editPdf(pdf, { fields: { nobody: "x" } }),
		).rejects.toBeInstanceOf(PdfEditError);
		await expect(
			editPdf(pdf, { fields: { city: "Berlin" } }),
		).rejects.toBeInstanceOf(PdfEditError);
	});

	test("writes highlight, ink and note annotations", async () => {
		const edited = await editPdf(await formPdf(), {
			author: "Ada",
			annotations: [
				{
					type: "highlight",
					page: 0,
					rects: [[100, 400, 200, 14]],
					color: [1, 0.9, 0],
				},
				{
					type: "ink",
					page: 0,
					strokes: [[10, 10, 20, 30, 40, 35]],
					color: [0, 0, 1],
					width: 2,
				},
				{
					type: "note",
					page: 1,
					x: 300,
					y: 500,
					text: "Check this",
					color: [1, 0.8, 0.2],
				},
			],
		});
		const first = (await annotationsOn(edited, 0)).filter(
			(a) => a.subtype !== "Widget",
		);
		expect(first.map((a) => a.subtype)).toEqual(["Highlight", "Ink"]);
		expect(first[0]?.rect).toEqual([100, 400, 300, 414]);
		// The ink's box takes in its stroke width.
		expect(first[1]?.rect).toEqual([8, 8, 42, 37]);
		const second = (await annotationsOn(edited, 1)).filter(
			(a) => a.subtype !== "Widget",
		);
		expect(second).toEqual([
			{ subtype: "Text", contents: "Check this", rect: [300, 480, 320, 500] },
		]);
	});

	test("keeps annotations already there", async () => {
		const once = await editPdf(await formPdf(), {
			annotations: [
				{ type: "note", page: 0, x: 10, y: 10, text: "one", color: [1, 1, 0] },
			],
		});
		const twice = await editPdf(once, {
			annotations: [
				{ type: "note", page: 0, x: 40, y: 40, text: "two", color: [1, 1, 0] },
			],
		});
		const notes = (await annotationsOn(twice, 0)).filter(
			(a) => a.subtype === "Text",
		);
		expect(notes.map((a) => a.contents)).toEqual(["one", "two"]);
	});

	test("draws a signature into the page", async () => {
		const pdf = await formPdf();
		const signed = await editPdf(pdf, {
			signatures: [{ page: 0, rect: [300, 100, 150, 50], image: PNG }],
		});
		const document = await PDFDocument.load(signed);
		expect(signed.byteLength).toBeGreaterThan(pdf.byteLength);
		expect(document.getPage(0).node.Resources()?.toString()).toContain(
			"XObject",
		);
	});

	test("refuses a signature that is not a PNG, and a page that is not there", async () => {
		const pdf = await formPdf();
		await expect(
			editPdf(pdf, {
				signatures: [
					{ page: 0, rect: [0, 0, 10, 10], image: "data:image/jpeg;base64,AA" },
				],
			}),
		).rejects.toBeInstanceOf(PdfEditError);
		await expect(
			editPdf(pdf, {
				annotations: [
					{ type: "note", page: 9, x: 0, y: 0, text: "", color: [0, 0, 0] },
				],
			}),
		).rejects.toBeInstanceOf(PdfEditError);
	});
});

describe("uprightPlacement", () => {
	test("turns the image against the page's rotation", () => {
		const rect = [100, 200, 40, 120] as [number, number, number, number];
		expect(uprightPlacement(rect, 0)).toEqual({
			x: 100,
			y: 200,
			width: 40,
			height: 120,
			rotate: 0,
		});
		// Shown turned a quarter clockwise: the box's height is the image's width.
		expect(uprightPlacement(rect, 90)).toEqual({
			x: 140,
			y: 200,
			width: 120,
			height: 40,
			rotate: 90,
		});
		expect(uprightPlacement(rect, 180)).toEqual({
			x: 140,
			y: 320,
			width: 40,
			height: 120,
			rotate: 180,
		});
		expect(uprightPlacement(rect, 270)).toEqual({
			x: 100,
			y: 320,
			width: 120,
			height: 40,
			rotate: 270,
		});
	});
});
