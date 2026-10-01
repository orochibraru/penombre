import {
	addNotes,
	notesPartFor,
	placeholderType,
	textShapes,
} from "../pptx-package";
import {
	childNamed,
	childrenNamed,
	element,
	findElements,
	isElement,
	parseXml,
	serializeXml,
	text,
} from "../xml";
import { partText, setPartText, type ZipEntry } from "../zip";

/** A slide's speaker notes, in its notes page; one is made when there is something to say. */
export function writeNotes(
	entries: ZipEntry[],
	part: string,
	notes: string,
): void {
	let notesPart = notesPartFor(entries, part);
	if (!notesPart && notes.trim()) {
		notesPart = addNotes(entries, part);
	}
	if (!notesPart) {
		return;
	}
	const document = parseXml(partText(entries, notesPart) ?? "");
	const shape = textShapes(document.root).find(
		(candidate) => placeholderType(candidate) === "body",
	);
	const body = shape && childNamed(shape, "p:txBody");
	if (!body) {
		return;
	}
	const current = childrenNamed(body, "a:p")
		.map((p) =>
			findElements(p, "a:t")
				.map((t) =>
					t.children.map((c) => (c.type === "text" ? c.text : "")).join(""),
				)
				.join(""),
		)
		.join("\n")
		.trim();
	if (current === notes.trim()) {
		return;
	}
	const head = body.children.filter(
		(child) => isElement(child) && child.name !== "a:p",
	);
	const lines = notes.trim() === "" ? [""] : notes.trim().split("\n");
	body.children = [
		...head,
		...lines.map((line) =>
			element(
				"a:p",
				{},
				line === ""
					? [element("a:endParaRPr", { lang: "en-US", dirty: "0" })]
					: [
							element("a:r", {}, [
								element("a:rPr", { lang: "en-US", dirty: "0" }),
								element("a:t", {}, [text(line)]),
							]),
						],
			),
		),
	];
	setPartText(entries, notesPart, serializeXml(document));
}
