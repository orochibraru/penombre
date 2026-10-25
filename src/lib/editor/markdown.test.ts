import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { defineBasicExtension } from "prosekit/basic";
import { createEditor, type NodeJSON, union } from "prosekit/core";
import type { Plugin, Transaction } from "prosekit/pm/state";
import type { EditorView } from "prosekit/pm/view";

import { defineMarkdown, looksLikeMarkdown, markdownToHtml } from "./markdown";

describe("looksLikeMarkdown", () => {
	it("knows blocks and inline marks", () => {
		for (const text of [
			"# Title",
			"Intro\n- one\n- two",
			"1. first",
			"> quoted",
			"```ts\nlet a\n```",
			"| a | b |\n| - | - |",
			"some **bold** words",
			"see [the site](https://example.com)",
			"run `bun test`",
		]) {
			expect(looksLikeMarkdown(text)).toBe(true);
		}
	});

	it("leaves prose alone", () => {
		for (const text of [
			"Just a sentence.",
			"Price: 3 * 4 = 12",
			"C# is a language",
			"2026. A year.",
		]) {
			expect(looksLikeMarkdown(text)).toBe(false);
		}
	});
});

describe("markdownToHtml", () => {
	it("renders GitHub-flavoured Markdown", () => {
		const html = markdownToHtml(
			"# Hi\n\n- [ ] task\n- **b**\n\n| a |\n| - |\n| 1 |\n\n~~x~~",
		);
		expect(html).toContain("<h1>Hi</h1>");
		expect(html).toContain('type="checkbox"');
		expect(html).toContain("<strong>b</strong>");
		expect(html).toContain("<table>");
		expect(html).toContain("<del>x</del>");
	});

	it("names a fence's language as the code block lists it", () => {
		expect(markdownToHtml("```js\nlet a\n```")).toContain(
			'class="language-javascript"',
		);
		expect(markdownToHtml("```go\nx\n```")).toContain('class="language-go"');
	});
});

const paragraph = (value: string): NodeJSON => ({
	type: "paragraph",
	content: [{ type: "text", text: value }],
});

function editorOver(content: NodeJSON[], anchor: number, head = anchor) {
	const editor = createEditor({
		extension: union(defineBasicExtension(), defineMarkdown()),
		defaultContent: { type: "doc", content },
		defaultSelection: { type: "text", anchor, head },
	});
	const dispatched: Transaction[] = [];
	const view = {
		get state() {
			return editor.state;
		},
		composing: false,
		dispatch: (tr: Transaction) => {
			dispatched.push(tr);
			editor.exec((_state, dispatch) => {
				dispatch?.(tr);
				return true;
			});
		},
	} as unknown as EditorView;
	return { editor, view, dispatched };
}

describe("typing a Markdown link", () => {
	/** What ProseMirror does with a keystroke: the first plugin to take it wins. */
	function typeAtCaret(view: EditorView, text: string): boolean {
		const at = view.state.selection.from;
		return view.state.plugins.some((plugin: Plugin) =>
			plugin.props.handleTextInput?.call(plugin, view, at, at, text, () => {
				throw new Error("no default insertion here");
			}),
		);
	}

	it("turns [text](url) into a link once the bracket closes", () => {
		const source = "see [the site](example.com/a";
		const { editor, view } = editorOver([paragraph(source)], source.length + 1);
		expect(typeAtCaret(view, ")")).toBe(true);
		const nodes = editor.getDocJSON().content?.[0]?.content ?? [];
		expect(nodes.map((node) => node.text)).toEqual(["see ", "the site"]);
		expect(nodes[1]?.marks?.[0]?.type).toBe("link");
		expect(nodes[1]?.marks?.[0]?.attrs?.href).toBe("https://example.com/a");
		expect(editor.state.storedMarks ?? []).toEqual([]);
	});

	it("leaves a link it would not follow as typed", () => {
		const source = "[x](javascript:void";
		const { editor, view, dispatched } = editorOver(
			[paragraph(source)],
			source.length + 1,
		);
		expect(typeAtCaret(view, ")")).toBe(false);
		expect(dispatched).toHaveLength(0);
		expect(editor.getDocJSON().content?.[0]?.content?.[0]?.text).toBe(source);
	});
});

describe("pasting Markdown", () => {
	const parsed: [string, string][] = [];
	class FakeParser {
		parseFromString(html: string, type: string) {
			parsed.push([html, type]);
			return { body: { firstChild: null, childNodes: [] } };
		}
	}
	const globals = globalThis as Record<string, unknown>;
	const saved = globals.window;

	beforeAll(() => {
		globals.window = { DOMParser: FakeParser };
	});
	afterAll(() => {
		if (saved === undefined) {
			delete globals.window;
		} else {
			globals.window = saved;
		}
	});

	function paste(content: NodeJSON[], clipboard: Record<string, string>) {
		const { editor, view, dispatched } = editorOver(content, 1, 3);
		parsed.length = 0;
		const plugin = view.state.plugins.find(
			(candidate) =>
				candidate.props.handlePaste && candidate.props.handleDOMEvents?.keydown,
		);
		const keydown = (event: Partial<KeyboardEvent>) =>
			plugin?.props.handleDOMEvents?.keydown?.call(
				plugin,
				view,
				event as KeyboardEvent,
			);
		const send = () =>
			plugin?.props.handlePaste?.call(
				plugin,
				view,
				{
					clipboardData: { getData: (type: string) => clipboard[type] ?? "" },
				} as unknown as ClipboardEvent,
				view.state.selection.content(),
			);
		return { editor, dispatched, keydown, send };
	}

	it("reads Markdown through an inert document and pastes it", () => {
		const { editor, dispatched, send } = paste([paragraph("hello")], {
			"text/plain": "# Title",
		});
		expect(send()).toBe(true);
		expect(parsed).toEqual([[markdownToHtml("# Title"), "text/html"]]);
		expect(dispatched[0]?.getMeta("paste")).toBe(true);
		expect(dispatched[0]?.getMeta("uiEvent")).toBe("paste");
		expect(editor.getDocJSON().content?.[0]?.content?.[0]?.text).toBe("llo");
	});

	it("keeps prose, and pages that bring their own structure, to the default paste", () => {
		expect(
			paste([paragraph("hello")], { "text/plain": "Just a sentence." }).send(),
		).toBe(false);
		expect(
			paste([paragraph("hello")], {
				"text/plain": "# Title",
				"text/html": "<h1>Title</h1>",
			}).send(),
		).toBe(false);
		expect(paste([paragraph("hello")], {}).send()).toBe(false);
		expect(parsed).toEqual([]);
	});

	it("pastes plain text with the shortcut, once", () => {
		const { keydown, send, dispatched } = paste([paragraph("hello")], {
			"text/plain": "**bold**",
		});
		expect(keydown({ metaKey: true, shiftKey: true, key: "V" })).toBe(false);
		expect(send()).toBe(false);
		expect(send()).toBe(true);
		keydown({ ctrlKey: true, shiftKey: true, key: "v" });
		keydown({ ctrlKey: true, key: "v" });
		expect(send()).toBe(true);
		expect(dispatched).toHaveLength(2);
	});

	it("pastes into a code block as written", () => {
		const code: NodeJSON = {
			type: "codeBlock",
			attrs: { language: "" },
			content: [{ type: "text", text: "let a" }],
		};
		expect(paste([code], { "text/plain": "# Title" }).send()).toBe(false);
	});
});
