import { describe, expect, it, mock } from "bun:test";

import { defineBasicExtension } from "prosekit/basic";
import { createEditor, type NodeJSON, union } from "prosekit/core";
import type { Command, Plugin, Transaction } from "prosekit/pm/state";
import type { EditorView } from "prosekit/pm/view";

import { PARAGRAPH_CHANGE } from "./changes";
import { defineDocumentExtension } from "./document-extension";
import { inkFor } from "./presence";
import {
	defineSuggestionClicks,
	reviewSuggestions,
	settleComposition,
	suggestAs,
	suggestionAt,
	suggestionsOf,
} from "./suggestions";

const ann = { id: "u-ann", name: "Ann" };
const bob = { id: "u-bob", name: "Bob" };

const text = (value: string, marks?: NodeJSON["marks"]): NodeJSON => ({
	type: "text",
	text: value,
	...(marks ? { marks } : {}),
});
const paragraph = (...content: NodeJSON[]): NodeJSON => ({
	type: "paragraph",
	content,
});

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

type Editor = ReturnType<typeof editorOver>;

const type =
	(value: string): Command =>
	(state, dispatch) => {
		dispatch?.(state.tr.insertText(value));
		return true;
	};

/** Backspace with a caret, or Delete when `forward`. */
const strike =
	(forward = false): Command =>
	(state, dispatch) => {
		const at = state.selection.head;
		dispatch?.(
			forward ? state.tr.delete(at, at + 1) : state.tr.delete(at - 1, at),
		);
		return true;
	};

const remove: Command = (state, dispatch) => {
	dispatch?.(state.tr.deleteSelection());
	return true;
};

/** Each text node of the first paragraph as `text` or `+text`/`-text`. */
function spans(editor: Editor, index = 0): string[] {
	const block = editor.getDocJSON().content?.[index];
	return (block?.content ?? []).map((node) => {
		const kinds = new Set((node.marks ?? []).map((mark) => mark.type));
		const prefix = kinds.has("insertion")
			? "+"
			: kinds.has("deletion")
				? "-"
				: "";
		return `${prefix}${node.text ?? ""}`;
	});
}

const markOf = (editor: Editor, kind: string) =>
	editor
		.getDocJSON()
		.content?.[0]?.content?.flatMap((node) => node.marks ?? [])
		.find((mark) => mark.type === kind);

describe("suggesting", () => {
	it("marks typed text as an insertion by its author", () => {
		const editor = editorOver([paragraph(text("hello"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		editor.exec(type("Y"));
		expect(spans(editor)).toEqual(["he", "+XY", "llo"]);
		const attrs = markOf(editor, "insertion")?.attrs;
		expect(attrs?.author).toBe("Ann");
		expect(attrs?.authorId).toBe("u-ann");
		expect(String(attrs?.date)).toMatch(/^\d{4}-\d\d-\d\dT/);
		expect(suggestionsOf(editor.state.doc)).toHaveLength(1);
	});

	it("strikes text rather than deleting it, and keeps the caret before it", () => {
		const editor = editorOver([paragraph(text("hello"))], 4);
		editor.exec(suggestAs(ann));
		editor.exec(strike());
		editor.exec(strike());
		expect(spans(editor)).toEqual(["h", "-el", "lo"]);
		expect(editor.state.selection.head).toBe(2);
		expect(suggestionsOf(editor.state.doc)).toHaveLength(1);
	});

	it("leaves the caret after what Delete struck", () => {
		const editor = editorOver([paragraph(text("hello"))], 2);
		editor.exec(suggestAs(ann));
		editor.exec(strike(true));
		expect(spans(editor)).toEqual(["h", "-e", "llo"]);
		expect(editor.state.selection.head).toBe(3);
	});

	it("really removes the suggester's own pending insertion", () => {
		const editor = editorOver([paragraph(text("ab"))], 2);
		editor.exec(suggestAs(ann));
		editor.exec(type("XY"));
		editor.exec(strike());
		expect(spans(editor)).toEqual(["a", "+X", "b"]);
		editor.exec(strike());
		expect(spans(editor)).toEqual(["ab"]);
	});

	it("strikes someone else's insertion instead of removing it", () => {
		const editor = editorOver([paragraph(text("ab"))], 2);
		editor.exec(suggestAs(bob));
		editor.exec(type("X"));
		editor.exec(suggestAs(ann));
		editor.exec(strike());
		const node = editor.getDocJSON().content?.[0]?.content?.[1];
		expect(node?.text).toBe("X");
		expect(node?.marks?.map((mark) => mark.type).sort()).toEqual([
			"deletion",
			"insertion",
		]);
	});

	it("makes a replacement one suggestion: deletion then insertion", () => {
		const editor = editorOver([paragraph(text("hello"))], 2, 5);
		editor.exec(suggestAs(ann));
		editor.exec(type("a"));
		expect(spans(editor)).toEqual(["h", "-ell", "+a", "o"]);
		const [only] = suggestionsOf(editor.state.doc);
		expect(only?.deleted).toBe("ell");
		expect(only?.inserted).toBe("a");
		expect(editor.state.selection.head).toBe(6);
	});

	it("suggests a paragraph break, and takes its own one back", () => {
		const editor = editorOver([paragraph(text("abcd"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.split(state.selection.head));
			return true;
		});
		const [first, second] = editor.getDocJSON().content ?? [];
		expect(first?.attrs?.paragraphChange).toMatchObject({
			kind: "insert",
			author: "Ann",
		});
		expect(second?.attrs?.paragraphChange ?? null).toBeNull();
		// Backspace at the start of the new paragraph.
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.join(4));
			return true;
		});
		expect(editor.getDocJSON().content).toHaveLength(1);
		expect(spans(editor)).toEqual(["abcd"]);
	});

	it("suggests removing an existing paragraph break instead of joining", () => {
		const editor = editorOver(
			[paragraph(text("ab")), paragraph(text("cd"))],
			5,
		);
		editor.exec(suggestAs(ann));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.join(4));
			return true;
		});
		const blocks = editor.getDocJSON().content ?? [];
		expect(blocks).toHaveLength(2);
		expect(blocks[0]?.attrs?.paragraphChange).toMatchObject({
			kind: "delete",
		});
		expect(suggestionsOf(editor.state.doc)[0]?.breaks).toBe(1);
	});

	it("leaves code blocks untracked, where marks are not allowed", () => {
		const editor = editorOver(
			[{ type: "codeBlock", content: [text("let a")] }],
			6,
		);
		editor.exec(suggestAs(ann));
		editor.exec(type("b"));
		editor.exec(strike());
		editor.exec(strike());
		expect(editor.getDocJSON().content?.[0]?.content).toEqual([text("let ")]);
	});

	it("finds the suggestion under a click", () => {
		const editor = editorOver([paragraph(text("hello"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		const [only] = suggestionsOf(editor.state.doc);
		expect(suggestionAt(editor.state.doc, 3)).toBe(only?.id ?? "");
		expect(suggestionAt(editor.state.doc, 1)).toBeNull();
	});
});

/** What an IME sends: text replacing `[from, to]`, flagged as composing. */
const compose =
	(from: number, to: number, value: string): Command =>
	(state, dispatch) => {
		dispatch?.(state.tr.insertText(value, from, to).setMeta("composition", 1));
		return true;
	};

const types = (editor: Editor) =>
	(editor.getDocJSON().content ?? []).map((node) => node.type);

describe("composing with an IME", () => {
	it("touches nothing while composing, then suggests what was composed", () => {
		const editor = editorOver([paragraph(text("hello"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec(compose(3, 3, "k"));
		editor.exec(compose(3, 4, "か"));
		editor.exec(compose(3, 4, "漢字"));
		expect(spans(editor)).toEqual(["he漢字llo"]);
		expect(editor.exec(settleComposition())).toBe(true);
		expect(spans(editor)).toEqual(["he", "+漢字", "llo"]);
		// Nothing left to settle, and the intermediate text was never struck.
		expect(editor.exec(settleComposition())).toBe(false);
		expect(suggestionsOf(editor.state.doc)[0]?.deleted).toBe("");
	});

	it("strikes the selection a composition replaced, once it ends", () => {
		const editor = editorOver([paragraph(text("hello"))], 2, 5);
		editor.exec(suggestAs(ann));
		editor.exec(compose(2, 5, "x"));
		editor.exec(compose(2, 3, "y"));
		expect(spans(editor)).toEqual(["hyo"]);
		editor.exec(settleComposition());
		expect(spans(editor)).toEqual(["h", "-ell", "+y", "o"]);
		expect(suggestionsOf(editor.state.doc)).toHaveLength(1);
	});

	it("follows edits made around it before it settles", () => {
		const editor = editorOver([paragraph(text("hello"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec(compose(3, 3, "字"));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.insertText("Z", 1).setMeta("addToHistory", false));
			return true;
		});
		editor.exec(settleComposition());
		const pieces = spans(editor);
		expect(pieces).toContain("+字");
		expect(pieces.join("").replace(/[+-]/g, "")).toBe("Zhe字llo");
	});

	it("composes plain text while editing", () => {
		const editor = editorOver([paragraph(text("ab"))], 2);
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		editor.exec(suggestAs(null));
		editor.exec(compose(3, 3, "字"));
		editor.exec(settleComposition());
		expect(spans(editor)).toEqual(["a", "+X", "字b"]);
	});
});

describe("deleting across what is not tracked", () => {
	it("strikes the text and leaves a divider where it was", () => {
		const editor = editorOver([
			paragraph(text("ab")),
			{ type: "horizontalRule" },
			paragraph(text("cd")),
		]);
		editor.exec(suggestAs(ann));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.delete(2, 7));
			return true;
		});
		expect(types(editor)).toEqual(["paragraph", "horizontalRule", "paragraph"]);
		expect(spans(editor, 0)).toEqual(["a", "-b"]);
		expect(spans(editor, 2)).toEqual(["-c", "d"]);
	});

	it("keeps code it cannot mark, and strikes the paragraph's text", () => {
		const editor = editorOver([
			paragraph(text("ab")),
			{ type: "codeBlock", content: [text("xy")] },
		]);
		editor.exec(suggestAs(ann));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.delete(2, 6));
			return true;
		});
		expect(types(editor)).toEqual(["paragraph", "codeBlock"]);
		expect(spans(editor, 0)).toEqual(["a", "-b"]);
		expect(spans(editor, 1)).toEqual(["xy"]);
	});

	it("still deletes a divider on its own", () => {
		const editor = editorOver([
			paragraph(text("ab")),
			{ type: "horizontalRule" },
			paragraph(text("cd")),
		]);
		editor.exec(suggestAs(ann));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.delete(4, 5));
			return true;
		});
		expect(types(editor)).toEqual(["paragraph", "paragraph"]);
	});
});

describe("editing over suggestions", () => {
	it("types plain text even inside a suggestion", () => {
		const editor = editorOver([paragraph(text("abcd"))], 2, 4);
		editor.exec(suggestAs(ann));
		editor.exec(remove);
		editor.exec(suggestAs(null));
		// Inside the struck "bc": the typed text would inherit its mark.
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.insertText("Z", 3));
			return true;
		});
		expect(spans(editor)).toEqual(["a", "-b", "Z", "-c", "d"]);
	});

	it("lets clear formatting keep suggestions", () => {
		const editor = editorOver([paragraph(text("ab"))], 2);
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		editor.exec(suggestAs(null));
		editor.commands.selectAll();
		editor.commands.clearFormatting();
		expect(spans(editor)).toEqual(["a", "+X", "b"]);
	});
});

describe("review", () => {
	function suggested() {
		const editor = editorOver([paragraph(text("hello"))], 2, 5);
		editor.exec(suggestAs(ann));
		editor.exec(type("a"));
		editor.exec(suggestAs(null));
		return editor;
	}

	it("accepts: insertions stay, deletions go", () => {
		const editor = suggested();
		expect(editor.exec(reviewSuggestions(true))).toBe(true);
		expect(spans(editor)).toEqual(["hao"]);
	});

	it("rejects: insertions go, deletions stay", () => {
		const editor = suggested();
		editor.exec(reviewSuggestions(false));
		expect(spans(editor)).toEqual(["hello"]);
	});

	it("reviews one suggestion and leaves the others", () => {
		const editor = editorOver([paragraph(text("abcdef"))], 2);
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		editor.exec(suggestAs(bob));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.insertText("Y", 7));
			return true;
		});
		const [first] = suggestionsOf(editor.state.doc);
		editor.exec(reviewSuggestions(false, new Set([first?.id ?? ""])));
		expect(spans(editor)).toEqual(["abcde", "+Y", "f"]);
	});

	it("accepts a suggested break removal by joining the paragraphs", () => {
		const editor = editorOver(
			[paragraph(text("ab")), paragraph(text("cd"))],
			5,
		);
		editor.exec(suggestAs(ann));
		editor.exec((state, dispatch) => {
			dispatch?.(state.tr.join(4));
			return true;
		});
		editor.exec(reviewSuggestions(true));
		expect(editor.getDocJSON().content).toHaveLength(1);
		expect(spans(editor)).toEqual(["abcd"]);
	});

	it("does nothing when there is nothing to review", () => {
		const editor = editorOver([paragraph(text("plain"))]);
		expect(editor.exec(reviewSuggestions(true))).toBe(false);
	});

	it("is undone with the edit that made it", () => {
		const editor = editorOver([paragraph(text("hello"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		editor.commands.undo();
		expect(spans(editor)).toEqual(["hello"]);
	});
});

/** The attributes a DOM output spec puts on its element. */
function outputAttrs(output: unknown): Record<string, unknown> {
	const [, attrs] = Array.isArray(output) ? output : [];
	return typeof attrs === "object" && attrs !== null ? attrs : {};
}

describe("the suggestion schema's DOM rules", () => {
	const schema = editorOver([paragraph(text("x"))]).state.schema;
	const change = {
		id: "s1",
		author: "Ann",
		authorId: "u-ann",
		date: "2026-01-02T03:04:05.000Z",
	};
	const element = (attributes: Record<string, string>) =>
		({
			nodeType: 1,
			nodeName: "P",
			style: { getPropertyValue: () => "" },
			attributes: Object.entries(attributes).map(([name, value]) => ({
				name,
				value,
			})),
			getAttribute: (name: string) => attributes[name] ?? null,
		}) as unknown as HTMLElement;
	const getAttrs = (rule: unknown) =>
		(rule as { getAttrs: (node: HTMLElement) => unknown }).getAttrs;

	it("writes a suggestion as ins or del, coloured by its author", () => {
		const { insertion, deletion } = schema.marks;
		const inserted = insertion?.create(change);
		expect(inserted && insertion?.spec.toDOM?.(inserted, true)).toEqual([
			"ins",
			{
				"data-suggestion": "s1",
				"data-author": "Ann",
				"data-author-id": "u-ann",
				"data-date": change.date,
				class: `suggestion ${inkFor("u-ann")}`,
			},
			0,
		]);
		const fromWord = deletion?.create({ ...change, authorId: "" });
		const output = fromWord && deletion?.spec.toDOM?.(fromWord, true);
		expect(Array.isArray(output) && output[0]).toBe("del");
		expect(outputAttrs(output).class).toBe(`suggestion ${inkFor("Ann")}`);
	});

	it("reads a suggestion back, above a plain strikethrough", () => {
		const rule = schema.marks.deletion?.spec.parseDOM?.[0];
		expect(rule).toMatchObject({ tag: "del[data-suggestion]", priority: 60 });
		const read = getAttrs(rule);
		expect(
			read(
				element({
					"data-suggestion": "s1",
					"data-author": "Ann",
					"data-author-id": "u-ann",
					"data-date": change.date,
				}),
			),
		).toEqual(change);
		expect(read(element({ class: "plain" }))).toBe(false);
	});

	it("writes and reads a suggested paragraph break", () => {
		const { paragraph: type } = schema.nodes;
		const suggested = { kind: "insert" as const, ...change };
		const node = type?.create({ paragraphChange: suggested });
		const written = outputAttrs(node && type?.spec.toDOM?.(node));
		expect(JSON.parse(String(written[PARAGRAPH_CHANGE]))).toEqual(suggested);
		const plain = type?.create();
		expect(outputAttrs(plain && type?.spec.toDOM?.(plain))).not.toHaveProperty(
			PARAGRAPH_CHANGE,
		);

		const read = getAttrs(type?.spec.parseDOM?.[0]);
		expect(
			read(element({ [PARAGRAPH_CHANGE]: JSON.stringify(suggested) })),
		).toMatchObject({ paragraphChange: suggested });
		expect(read(element({}))).toMatchObject({ paragraphChange: null });
	});

	it("refuses a schema without the suggestion marks", () => {
		const plain = createEditor({ extension: defineBasicExtension() });
		expect(() => suggestionsOf(plain.state.doc)).toThrow(
			"The suggestion marks are not in the schema",
		);
	});
});

describe("clicking a suggestion", () => {
	it("opens the suggestion under the caret and lets the click through", () => {
		const onOpen = mock((_id: string, _pos: number) => undefined);
		const editor = createEditor({
			extension: union(
				defineDocumentExtension({
					onDocChange: () => undefined,
					onUpdate: () => undefined,
					keys: {},
				}),
				defineSuggestionClicks(onOpen),
			),
			defaultContent: { type: "doc", content: [paragraph(text("hello"))] },
			defaultSelection: { type: "text", anchor: 3, head: 3 },
		});
		editor.exec(suggestAs(ann));
		editor.exec(type("X"));
		const view = { state: editor.state } as unknown as EditorView;
		const click = (pos: number) =>
			editor.state.plugins.some((plugin) =>
				plugin.props.handleClick?.call(
					plugin,
					view,
					pos,
					{} as unknown as MouseEvent,
				),
			);
		const [only] = suggestionsOf(editor.state.doc);
		expect(click(3)).toBe(false);
		expect(onOpen).toHaveBeenCalledWith(only?.id ?? "", 3);
		onOpen.mockClear();
		expect(click(1)).toBe(false);
		expect(onOpen).not.toHaveBeenCalled();
	});
});

describe("settling a composition from the view", () => {
	function composing() {
		const editor = editorOver([paragraph(text("hello"))], 3);
		editor.exec(suggestAs(ann));
		editor.exec(compose(3, 3, "字"));
		const plugin = editor.state.plugins.find((candidate) =>
			String((candidate as Plugin & { key: string }).key).startsWith(
				"suggestions",
			),
		);
		let isComposing = true;
		const view = {
			get state() {
				return editor.state;
			},
			get composing() {
				return isComposing;
			},
			dispatch: (tr: Transaction) =>
				editor.exec((_state, dispatch) => {
					dispatch?.(tr);
					return true;
				}),
		} as unknown as EditorView;
		const pluginView = plugin?.spec.view?.(view);
		const compositionEnd = () =>
			plugin?.props.handleDOMEvents?.compositionend?.call(
				plugin,
				view,
				{} as CompositionEvent,
			);
		const finish = () => {
			isComposing = false;
		};
		return { editor, view, pluginView, compositionEnd, finish };
	}

	it("waits for the composition to end, then suggests it", () => {
		const { editor, view, pluginView, finish } = composing();
		pluginView?.update?.(view, editor.state);
		expect(spans(editor)).toEqual(["he字llo"]);
		finish();
		pluginView?.update?.(view, editor.state);
		expect(spans(editor)).toEqual(["he", "+字", "llo"]);
		pluginView?.destroy?.();
	});

	it("settles shortly after compositionend, unless the view is gone", async () => {
		const settled = composing();
		settled.finish();
		expect(settled.compositionEnd()).toBe(false);
		const destroyed = composing();
		destroyed.finish();
		destroyed.compositionEnd();
		destroyed.pluginView?.destroy?.();
		await Bun.sleep(100);
		expect(spans(settled.editor)).toEqual(["he", "+字", "llo"]);
		expect(spans(destroyed.editor)).toEqual(["he字llo"]);
		settled.pluginView?.destroy?.();
	});
});
