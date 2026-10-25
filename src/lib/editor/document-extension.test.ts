import { describe, expect, it, mock } from "bun:test";

import { createEditor, isApple, type NodeJSON } from "prosekit/core";
import type { TagParseRule } from "prosekit/pm/model";
import type { EditorState, Plugin } from "prosekit/pm/state";
import type { EditorView } from "prosekit/pm/view";

import { leaveCodeDown } from "./code-block";
import {
	blockValue,
	clearFormatting,
	defineDocumentExtension,
	type DocumentHandlers,
	hasHeaderRow,
	markValue,
	setMark,
	shiftIndent,
	toggleHeaderRow,
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

const handlers = (
	overrides: Partial<DocumentHandlers> = {},
): DocumentHandlers => ({
	onDocChange: () => undefined,
	onUpdate: () => undefined,
	keys: {},
	...overrides,
});

describe("refusing what does not apply", () => {
	it("sets no mark the schema lacks", () => {
		const editor = editorOver([paragraph(text("x"))], 1, 2);
		expect(setMark("nonsense", { size: "1pt" })(editor.state)).toBe(false);
	});

	it("indents nothing when no paragraph or heading is selected", () => {
		const editor = createEditor({
			extension: defineDocumentExtension(handlers()),
			defaultContent: {
				type: "doc",
				content: [{ type: "horizontalRule" }, paragraph(text("x"))],
			},
			defaultSelection: { type: "node", anchor: 0, head: 0 },
		});
		expect(shiftIndent(1)(editor.state)).toBe(false);
		expect(editor.commands.setLineHeight.canExec("2")).toBe(false);
	});

	it("toggles no header row outside a table", () => {
		const editor = editorOver([paragraph(text("x"))]);
		expect(toggleHeaderRow()(editor.state)).toBe(false);
		expect(hasHeaderRow(editor.state)).toBe(false);
	});
});

describe("formatting at a caret", () => {
	it("keeps a link and suggestions for the next keystroke, nothing else", () => {
		const editor = editorOver(
			[
				paragraph(
					text("ab", [
						{ type: "italic" },
						{ type: "link", attrs: { href: "https://a.example" } },
					]),
				),
			],
			2,
		);
		editor.exec(clearFormatting());
		const stored = editor.state.storedMarks ?? [];
		expect(stored.map((mark) => mark.type.name)).toEqual(["link"]);
		expect(markValue(editor.state, "link", "href")).toBe("https://a.example");
	});

	it("reads no value from a mark that is not there, or not a string", () => {
		const editor = editorOver([paragraph(text("x"))], 1);
		expect(markValue(editor.state, "fontSize", "size")).toBeNull();
		expect(blockValue(editor.state, "lineHeight")).toBeNull();
	});
});

describe("lists", () => {
	const list = (...items: string[]): NodeJSON[] =>
		items.map((item) => ({
			type: "list",
			attrs: { kind: "bullet" },
			content: [paragraph(text(item))],
		}));

	it("moves a list item a level instead of indenting its paragraph", () => {
		const editor = editorOver(list("a", "b"), 7);
		editor.commands.shiftIndent(1);
		const [first] = editor.getDocJSON().content ?? [];
		expect(first?.content?.map((node) => node.type)).toEqual([
			"paragraph",
			"list",
		]);
		expect(blockValue(editor.state, "indent")).toBeNull();
		editor.commands.shiftIndent(-1);
		expect(editor.getDocJSON().content?.map((node) => node.type)).toEqual([
			"list",
			"list",
		]);
	});
});

/** The attributes a DOM output spec puts on its element. */
function outputAttrs(output: unknown): Record<string, unknown> {
	const [, attrs] = Array.isArray(output) ? output : [];
	return typeof attrs === "object" && attrs !== null ? attrs : {};
}

describe("the schema's DOM rules", () => {
	const element = (
		styles: Record<string, string>,
		attributes: Record<string, string> = {},
	) =>
		({
			nodeType: 1,
			nodeName: "P",
			style: {
				...styles,
				getPropertyValue: (name: string) => styles[name] ?? "",
			},
			getAttribute: (name: string) => attributes[name] ?? null,
			hasAttribute: (name: string) => name in attributes,
			attributes: [],
		}) as unknown as HTMLElement;

	const schema = editorOver([paragraph(text("x"))]).state.schema;

	it("writes a paragraph's formatting as style, and nothing when unformatted", () => {
		const { paragraph: type } = schema.nodes;
		const formatted = type?.create({
			textAlign: "center",
			lineHeight: "1.5",
			indent: "36pt",
		});
		const plain = type?.create();
		expect(outputAttrs(formatted && type?.spec.toDOM?.(formatted)).style).toBe(
			"margin-left:36pt; line-height:1.5; text-align:center",
		);
		expect(outputAttrs(plain && type?.spec.toDOM?.(plain))).not.toHaveProperty(
			"style",
		);
	});

	it("reads a paragraph's formatting back, refusing nonsense", () => {
		const rule = schema.nodes.paragraph?.spec.parseDOM?.[0] as TagParseRule;
		const read = (styles: Record<string, string>) =>
			rule.getAttrs?.(element(styles));
		expect(
			read({
				"text-align": "right",
				"line-height": "2",
				"margin-left": "18pt",
			}),
		).toMatchObject({ textAlign: "right", lineHeight: "2", indent: "18pt" });
		expect(
			read({ "text-align": "", "line-height": "normal", "margin-left": "2em" }),
		).toMatchObject({ textAlign: null, lineHeight: null, indent: null });
		expect(read({ "line-height": "0" })).toMatchObject({ lineHeight: null });
	});

	it("writes and reads font sizes in points", () => {
		const type = schema.marks.fontSize;
		const mark = type?.create({ size: "14pt" });
		expect(mark && type?.spec.toDOM?.(mark, true)).toEqual([
			"span",
			{ style: "font-size: 14pt;", "data-font-size": "14pt" },
			0,
		]);
		const rule = type?.spec.parseDOM?.[0] as TagParseRule;
		const read = (node: HTMLElement) => rule.getAttrs?.(node);
		expect(read(element({ fontSize: "16px" }))).toEqual({ size: "12pt" });
		expect(
			read(element({ fontSize: "" }, { "data-font-size": "9pt" })),
		).toEqual({ size: "9pt" });
		expect(read(element({ fontSize: "1em" }))).toBe(false);
	});
});

describe("the page's handlers", () => {
	const pluginNamed = (state: EditorState, name: string) =>
		state.plugins.find((plugin) =>
			String((plugin as Plugin & { key: string }).key).startsWith(name),
		);

	it("answers the page's keys", () => {
		const find = mock(() => undefined);
		const replace = mock(() => undefined);
		const editor = createEditor({
			extension: defineDocumentExtension(
				handlers({ keys: { "Alt-p": find, "Ctrl-h": replace } }),
			),
			defaultContent: { type: "doc", content: [paragraph(text("x"))] },
		});
		const view = {
			state: editor.state,
			dispatch: () => undefined,
			endOfTextblock: () => false,
		} as unknown as EditorView;
		const press = (event: Partial<KeyboardEvent>) =>
			editor.state.plugins.some((plugin) =>
				plugin.props.handleKeyDown?.call(plugin, view, {
					altKey: false,
					ctrlKey: false,
					metaKey: false,
					shiftKey: false,
					...event,
				} as KeyboardEvent),
			);
		expect(press({ key: "p", keyCode: 80, altKey: true })).toBe(true);
		expect(find).toHaveBeenCalledTimes(1);
		// Ctrl-H is the system's delete-backward on Apple platforms.
		press({ key: "h", keyCode: 72, ctrlKey: true });
		expect(replace).toHaveBeenCalledTimes(isApple ? 0 : 1);
	});

	it("tells the page about every update, and about document changes", () => {
		const onDocChange = mock((_doc: unknown) => undefined);
		const onUpdate = mock(() => undefined);
		const editor = createEditor({
			extension: defineDocumentExtension(handlers({ onDocChange, onUpdate })),
			defaultContent: { type: "doc", content: [paragraph(text("x"))] },
		});
		const handler = pluginNamed(editor.state, "prosekit-plugin-view-handler");
		const viewOf = (state: EditorState) =>
			({ state, isDestroyed: false }) as unknown as EditorView;
		const before = editor.state;
		const pluginView = handler?.spec.view?.(viewOf(before));
		pluginView?.update?.(viewOf(before), before);
		expect(onUpdate).toHaveBeenCalledTimes(1);
		expect(onDocChange).not.toHaveBeenCalled();
		editor.commands.setLineHeight("2");
		pluginView?.update?.(viewOf(editor.state), before);
		expect(onUpdate).toHaveBeenCalledTimes(2);
		expect(onDocChange).toHaveBeenCalledWith(editor.state.doc);
	});
});
