import { describe, expect, it } from "bun:test";
import { createEditor, type NodeJSON } from "prosekit/core";
import { leaveCodeDown } from "./code-block";
import {
	blockValue,
	defineDocumentExtension,
	hasHeaderRow,
	markValue,
} from "./document-extension";
import {
	firstFamily,
	keyLabel,
	linkTarget,
	nextIndent,
	points,
} from "./document-format";

const text = (value: string, marks?: NodeJSON["marks"]): NodeJSON => ({
	type: "text",
	text: value,
	...(marks ? { marks } : {}),
});
const paragraph = (...content: NodeJSON[]): NodeJSON => ({
	type: "paragraph",
	content,
});
const cell = (type: string, value: string): NodeJSON => ({
	type,
	content: [paragraph(text(value))],
});

/** An editor over `content`, selecting `anchor` to `head`, never mounted. */
function editorOver(content: NodeJSON[], anchor = 1, head = anchor) {
	return createEditor({
		extension: defineDocumentExtension({
			onDocChange: () => undefined,
			onUpdate: () => undefined,
			keys: {},
		}),
		defaultContent: { type: "doc", content },
		defaultSelection: { type: "text", anchor, head },
	});
}

describe("document commands", () => {
	it("sizes a range, and a caret's next keystroke", () => {
		const editor = editorOver([paragraph(text("hello"))], 1, 3);
		editor.commands.setMark("fontSize", { size: "14pt" });
		expect(editor.getDocJSON().content?.[0]?.content?.[0]?.marks).toEqual([
			{ type: "fontSize", attrs: { size: "14pt" } },
		]);

		const caret = editorOver([paragraph(text("hello"))], 3);
		caret.commands.setMark("textColor", { color: "#dc2626" });
		expect(markValue(caret.state, "textColor", "color")).toBe("#dc2626");
		caret.commands.setMark("textColor", null);
		expect(markValue(caret.state, "textColor", "color")).toBeNull();
	});

	it("clears every mark but a link", () => {
		const editor = editorOver(
			[
				paragraph(
					text("x", [
						{ type: "bold" },
						{ type: "link", attrs: { href: "https://a.example" } },
						{ type: "fontSize", attrs: { size: "20pt" } },
					]),
				),
			],
			1,
			2,
		);
		editor.commands.clearFormatting();
		const marks = editor.getDocJSON().content?.[0]?.content?.[0]?.marks ?? [];
		expect(marks.map((mark) => mark.type)).toEqual(["link"]);
	});

	it("indents a paragraph by stops and back to nothing", () => {
		const editor = editorOver([paragraph(text("x"))]);
		editor.commands.shiftIndent(1);
		editor.commands.shiftIndent(1);
		expect(blockValue(editor.state, "indent")).toBe("72pt");
		editor.commands.shiftIndent(-1);
		editor.commands.shiftIndent(-1);
		expect(blockValue(editor.state, "indent")).toBeNull();
	});

	it("sets line spacing on every selected block", () => {
		const editor = editorOver(
			[paragraph(text("a")), paragraph(text("b"))],
			1,
			5,
		);
		editor.commands.setLineHeight("1.5");
		const blocks = editor.getDocJSON().content ?? [];
		expect(blocks.map((block) => block.attrs?.lineHeight)).toEqual([
			"1.5",
			"1.5",
		]);
	});

	it("toggles the first row between header and body cells", () => {
		const table: NodeJSON = {
			type: "table",
			content: [
				{
					type: "tableRow",
					content: [cell("tableCell", "a"), cell("tableCell", "b")],
				},
				{
					type: "tableRow",
					content: [cell("tableCell", "c"), cell("tableCell", "d")],
				},
			],
		};
		// Inside the first cell's paragraph: table, row, cell, paragraph.
		const editor = editorOver([table], 4);
		expect(hasHeaderRow(editor.state)).toBe(false);
		editor.commands.toggleHeaderRow();
		expect(hasHeaderRow(editor.state)).toBe(true);
		const rows = editor.getDocJSON().content?.[0]?.content ?? [];
		expect(rows[1]?.content?.[0]?.type).toBe("tableCell");
		editor.commands.toggleHeaderRow();
		expect(hasHeaderRow(editor.state)).toBe(false);
	});
});

describe("document formats", () => {
	it("keeps sizes in points", () => {
		expect(points("12pt")).toBe("12pt");
		expect(points("16px")).toBe("12pt");
		expect(points("1.2em")).toBeNull();
		expect(points("")).toBeNull();
	});

	it("steps indents to the next stop", () => {
		expect(nextIndent(null, 1)).toBe("36pt");
		expect(nextIndent("18pt", 1)).toBe("36pt");
		expect(nextIndent("50pt", -1)).toBe("36pt");
		expect(nextIndent("36pt", -1)).toBeNull();
		expect(nextIndent(null, -1)).toBeNull();
	});

	it("compares font stacks by their first family", () => {
		expect(firstFamily('"Times New Roman", Times, serif')).toBe(
			"Times New Roman",
		);
		expect(firstFamily("Georgia")).toBe("Georgia");
	});
});

describe("links and keys", () => {
	it("accepts web and mail links, and refuses script", () => {
		expect(linkTarget("example.com/a")).toBe("https://example.com/a");
		expect(linkTarget("mailto:a@b.example")).toBe("mailto:a@b.example");
		expect(linkTarget("javascript:alert(1)")).toBeNull();
		expect(linkTarget("  ")).toBeNull();
	});

	it("spells a binding for the platform", () => {
		expect(keyLabel("Mod-Shift-s", true)).toBe("⌘⇧S");
		expect(keyLabel("Mod-Shift-s", false)).toBe("Ctrl+Shift+S");
		expect(keyLabel("Mod-\\", false)).toBe("Ctrl+\\");
		expect(keyLabel("Mod--", false)).toBe("Ctrl+-");
	});
});

describe("leaving a code block", () => {
	const code = (value: string): NodeJSON => ({
		type: "codeBlock",
		attrs: { language: "" },
		content: [text(value)],
	});

	it("adds a paragraph below the last line of a block that ends the document", () => {
		const editor = editorOver([code("a\nb")], 4);
		let after = editor.state.doc;
		expect(
			leaveCodeDown(editor.state, (tr) => {
				after = tr.doc;
			}),
		).toBe(true);
		expect(after.childCount).toBe(2);
		expect(after.lastChild?.type.name).toBe("paragraph");
	});

	it("leaves the arrow alone above the last line or before other blocks", () => {
		const first = editorOver([code("a\nb")], 2);
		expect(leaveCodeDown(first.state)).toBe(false);
		const followed = editorOver([code("a"), paragraph(text("x"))], 2);
		expect(leaveCodeDown(followed.state)).toBe(false);
	});
});
