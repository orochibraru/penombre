import { describe, expect, it } from "bun:test";

import { createEditor, type NodeJSON } from "prosekit/core";
import type { Command } from "prosekit/pm/state";

import { defineDocumentExtension } from "./document-extension";
import {
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
