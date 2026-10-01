import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import pdfmake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

/**
 * pdfmake, set up once: Roboto from its own package, the PDF standard faces
 * by name, and nothing fetched or read from anywhere else. A document's
 * pictures are data URLs, so no network access is ever needed.
 */

const STANDARD = {
	Times: ["Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic"],
	Courier: [
		"Courier",
		"Courier-Bold",
		"Courier-Oblique",
		"Courier-BoldOblique",
	],
};

let ready = false;

function setUp(): void {
	if (ready) {
		return;
	}
	// Resolved at run time: the server bundle is not where the fonts are.
	const root = dirname(
		createRequire(import.meta.url).resolve("pdfmake/package.json"),
	);
	const fonts = join(root, "fonts", "Roboto");
	const roboto = (face: string) => join(fonts, `Roboto-${face}.ttf`);
	const faces = ([normal, bold, italics, bolditalics]: string[]) => ({
		normal: normal ?? "",
		bold: bold ?? "",
		italics: italics ?? "",
		bolditalics: bolditalics ?? "",
	});
	pdfmake.setFonts({
		Roboto: faces(["Regular", "Medium", "Italic", "MediumItalic"].map(roboto)),
		Times: faces(STANDARD.Times),
		Courier: faces(STANDARD.Courier),
	});
	const standard = new Set(Object.values(STANDARD).flat());
	pdfmake.setUrlAccessPolicy(() => false);
	pdfmake.setLocalAccessPolicy(
		(path) => path.startsWith(`${fonts}/`) || standard.has(path),
	);
	ready = true;
}

export function renderPdf(definition: TDocumentDefinitions): Promise<Buffer> {
	setUp();
	return pdfmake.createPdf(definition).getBuffer();
}
