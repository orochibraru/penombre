import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";

import { defineBasicExtension } from "prosekit/basic";
import { createEditor, type NodeJSON, union } from "prosekit/core";
import type { ProseMirrorNode } from "prosekit/pm/model";
import type { EditorState, Plugin, Transaction } from "prosekit/pm/state";
import type { Decoration, DecorationSet, EditorView } from "prosekit/pm/view";

import {
	CODE_LANGUAGES,
	defineCodeBlockExtras,
	type LanguagePicker,
} from "./code-block";

const code = (language: string, value: string): NodeJSON => ({
	type: "codeBlock",
	attrs: { language },
	content: [{ type: "text", text: value }],
});

function editorOver(content: NodeJSON[], picker?: LanguagePicker) {
	return createEditor({
		extension: union(defineBasicExtension(), defineCodeBlockExtras(picker)),
		defaultContent: { type: "doc", content },
	});
}

describe("the language picker's list", () => {
	it("offers every language once, with a label", () => {
		const values = CODE_LANGUAGES.map((language) => language.value);
		expect(new Set(values).size).toBe(values.length);
		expect(CODE_LANGUAGES).toContainEqual({
			value: "typescript",
			label: "TypeScript",
		});
		expect(CODE_LANGUAGES.every((language) => language.label)).toBe(true);
	});
});

describe("highlighting", () => {
	interface HighlightState {
		decorations?: DecorationSet;
		promises: Promise<void>[];
	}

	const highlightOf = (state: EditorState) => {
		const plugin = state.plugins.find((candidate) =>
			String((candidate as Plugin & { key: string }).key).startsWith(
				"prosemirror-highlight",
			),
		);
		return plugin?.getState(state) as HighlightState | undefined;
	};

	/** The decorations once the highlighter has loaded, however long that took. */
	async function decorationsOf(content: NodeJSON[]): Promise<Decoration[]> {
		const first = highlightOf(editorOver(content).state);
		await Promise.all(first?.promises ?? []);
		const settled = highlightOf(editorOver(content).state);
		expect(settled?.promises).toEqual([]);
		return settled?.decorations?.find() ?? [];
	}

	const attrsOf = (decoration: Decoration) =>
		(decoration as unknown as { type: { attrs: Record<string, string> } }).type
			.attrs;

	it("colours a block's tokens for both themes, line by line", async () => {
		const source = "const a = 1;\nlet b = a;";
		const decorations = await decorationsOf([code("typescript", source)]);
		expect(decorations.length).toBeGreaterThan(4);
		const sorted = decorations.toSorted((a, b) => a.from - b.from);
		expect(sorted[0]?.from).toBe(1);
		expect(sorted.at(-1)?.to).toBe(1 + source.length);
		const newline = 1 + source.indexOf("\n");
		expect(sorted.some((decoration) => decoration.from === newline + 1)).toBe(
			true,
		);
		expect(
			sorted.some(
				(decoration) => decoration.from <= newline && decoration.to > newline,
			),
		).toBe(false);
		for (const decoration of sorted) {
			expect(attrsOf(decoration)?.class).toBe("code-token");
			expect(attrsOf(decoration)?.style).toContain("--shiki-dark");
		}
	});

	it("leaves plain text, no language and unknown languages alone", async () => {
		expect(await decorationsOf([code("", "const a = 1;")])).toEqual([]);
		expect(await decorationsOf([code("text", "const a = 1;")])).toEqual([]);
		expect(await decorationsOf([code("klingon", "const a = 1;")])).toEqual([]);
	});
});

describe("the block's view", () => {
	class FakeNode {
		readonly children: FakeNode[] = [];
		parent: FakeNode | undefined;
		className = "";
		contentEditable = "inherit";
		readonly style: Record<string, string> = {};

		constructor(readonly tagName: string) {}

		append(...nodes: FakeNode[]) {
			for (const node of nodes) {
				node.parent = this;
				this.children.push(node);
			}
		}

		contains(other: FakeNode) {
			for (let node: FakeNode | undefined = other; node; node = node.parent) {
				if (node === this) {
					return true;
				}
			}
			return false;
		}
	}

	const globals = globalThis as Record<string, unknown>;
	const saved = { document: globals.document, Node: globals.Node };

	beforeAll(() => {
		globals.document = {
			createElement: (tag: string) => new FakeNode(tag.toUpperCase()),
		};
		globals.Node = FakeNode;
	});
	afterAll(() => {
		for (const [name, value] of Object.entries(saved)) {
			if (value === undefined) {
				delete globals[name];
			} else {
				globals[name] = value;
			}
		}
	});

	interface NodeView {
		dom: FakeNode;
		contentDOM: FakeNode;
		update: (node: ProseMirrorNode) => boolean;
		destroy: () => void;
		stopEvent: (event: { target: unknown }) => boolean;
		ignoreMutation: (mutation: { target: unknown }) => boolean;
	}

	function mount(
		picker?: LanguagePicker,
		getPos: () => number | undefined = () => 0,
	) {
		const editor = editorOver([code("js", "let a")], picker);
		const focus = mock(() => undefined);
		const view = {
			get state() {
				return editor.state;
			},
			dispatch: (tr: Transaction) =>
				editor.exec((_state, dispatch) => {
					dispatch?.(tr);
					return true;
				}),
			focus,
		} as unknown as EditorView;
		const construct = editor.state.plugins.find(
			(plugin) => plugin.props.nodeViews?.codeBlock,
		)?.props.nodeViews?.codeBlock;
		const node = editor.state.doc.firstChild;
		if (!(construct && node)) {
			throw new Error("No code block view");
		}
		const nodeView = construct(
			node,
			view,
			getPos,
			[],
			{} as never,
		) as unknown as NodeView;
		return { editor, nodeView, focus };
	}

	function picker() {
		const drawn = {
			update: mock((_language: string) => undefined),
			destroy: mock(() => undefined),
		};
		let pick: (language: string) => void = () => undefined;
		const calls: [FakeNode, string][] = [];
		const draw: LanguagePicker = (target, language, onPick) => {
			const button = new FakeNode("BUTTON");
			(target as unknown as FakeNode).append(button);
			calls.push([target as unknown as FakeNode, language]);
			pick = onPick;
			return drawn;
		};
		return { draw, drawn, calls, pick: (language: string) => pick(language) };
	}

	it("draws the code under a picker kept out of the text", () => {
		const languages = picker();
		const { nodeView } = mount(languages.draw);
		const [header, pre] = nodeView.dom.children;
		expect(nodeView.dom.className).toBe("relative");
		expect(header?.contentEditable).toBe("false");
		expect(languages.calls).toEqual([[header as FakeNode, "js"]]);
		expect(pre?.tagName).toBe("PRE");
		expect(pre?.style.paddingTop).toBe("2rem");
		expect(nodeView.contentDOM.tagName).toBe("CODE");
		expect(nodeView.contentDOM.parent).toBe(pre);
	});

	it("sets the block's language from the picker and returns to the text", () => {
		const languages = picker();
		const { editor, focus } = mount(languages.draw);
		languages.pick("rust");
		expect(editor.getDocJSON().content?.[0]?.attrs?.language).toBe("rust");
		expect(focus).toHaveBeenCalledTimes(1);
	});

	it("ignores a pick once the block is gone", () => {
		const languages = picker();
		const { editor, focus } = mount(languages.draw, () => undefined);
		languages.pick("rust");
		expect(editor.getDocJSON().content?.[0]?.attrs?.language).toBe("js");
		expect(focus).not.toHaveBeenCalled();
	});

	it("redraws the picker only when the language changes", () => {
		const languages = picker();
		const { editor, nodeView } = mount(languages.draw);
		const block = editor.state.doc.firstChild as ProseMirrorNode;
		expect(nodeView.update(block)).toBe(true);
		expect(languages.drawn.update).not.toHaveBeenCalled();
		const python = block.type.create(
			{ ...block.attrs, language: "python" },
			block.content,
		);
		expect(nodeView.update(python)).toBe(true);
		expect(languages.drawn.update).toHaveBeenCalledWith("python");
		const paragraph = editor.state.schema.nodes.paragraph?.create();
		expect(paragraph && nodeView.update(paragraph)).toBe(false);
		nodeView.destroy();
		expect(languages.drawn.destroy).toHaveBeenCalledTimes(1);
	});

	it("keeps the editor out of the picker's events and mutations", () => {
		const { nodeView } = mount(picker().draw);
		const button = nodeView.dom.children[0]?.children[0];
		expect(nodeView.stopEvent({ target: button })).toBe(true);
		expect(nodeView.stopEvent({ target: nodeView.contentDOM })).toBe(false);
		expect(nodeView.stopEvent({ target: {} })).toBe(false);
		expect(nodeView.ignoreMutation({ target: button })).toBe(true);
		expect(nodeView.ignoreMutation({ target: nodeView.contentDOM })).toBe(
			false,
		);
	});

	it("works without a picker", () => {
		const { editor, nodeView } = mount();
		expect(nodeView.dom.children[0]?.children).toEqual([]);
		const block = editor.state.doc.firstChild as ProseMirrorNode;
		const go = block.type.create({ ...block.attrs, language: "go" });
		expect(nodeView.update(go)).toBe(true);
		expect(() => nodeView.destroy()).not.toThrow();
	});
});
