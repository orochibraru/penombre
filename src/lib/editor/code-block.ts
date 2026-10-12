import {
	defineKeymap,
	defineNodeView,
	Priority,
	union,
	withPriority,
} from "prosekit/core";
import { defineCodeBlockHighlight } from "prosekit/extensions/code-block";
import { exitCode } from "prosekit/pm/commands";
import type { ProseMirrorNode } from "prosekit/pm/model";
import type { Command, EditorState } from "prosekit/pm/state";
import { Decoration, type EditorView } from "prosekit/pm/view";
import type { HighlighterCore } from "shiki/core";

/**
 * Code blocks: highlighting, a language picker on the block and a way out.
 *
 * ProseKit's basics already turn ``` (or ```rust) into a block, and three
 * Enters at its end leave it; ArrowDown on the last line of a block nothing
 * follows adds the paragraph that line has nowhere else to go to.
 *
 * Highlighting borrows the file preview's Shiki, imported the first time a
 * block names a language, so a document without code never downloads it.
 */

/** What the picker offers: the languages the preview's highlighter loads. */
export const CODE_LANGUAGES: { value: string; label: string }[] = [
	["bash", "Bash"],
	["c", "C"],
	["cpp", "C++"],
	["csharp", "C#"],
	["css", "CSS"],
	["diff", "Diff"],
	["dockerfile", "Dockerfile"],
	["go", "Go"],
	["html", "HTML"],
	["java", "Java"],
	["javascript", "JavaScript"],
	["json", "JSON"],
	["kotlin", "Kotlin"],
	["markdown", "Markdown"],
	["php", "PHP"],
	["python", "Python"],
	["ruby", "Ruby"],
	["rust", "Rust"],
	["sql", "SQL"],
	["svelte", "Svelte"],
	["swift", "Swift"],
	["toml", "TOML"],
	["typescript", "TypeScript"],
	["xml", "XML"],
	["yaml", "YAML"],
].map(([value = "", label = ""]) => ({ value, label }));

const THEMES = { light: "github-light-default", dark: "github-dark-default" };

let highlighter: HighlighterCore | undefined;
let loading: Promise<void> | undefined;
let failed = false;

const styleText = (style: string | Record<string, string> | undefined) =>
	typeof style === "string"
		? style
		: Object.entries(style ?? {})
				.map(([name, value]) => `${name}:${value}`)
				.join(";");

/** Token colours as decorations; `--shiki-dark` carries the dark theme's. */
function highlight(
	content: string,
	language: string,
	pos: number,
): Decoration[] {
	if (!highlighter) {
		return [];
	}
	let tokens: ReturnType<HighlighterCore["codeToTokens"]>["tokens"];
	try {
		({ tokens } = highlighter.codeToTokens(content, {
			lang: language,
			themes: THEMES,
		}));
	} catch {
		// A language the highlighter does not know stays plain.
		return [];
	}
	const decorations: Decoration[] = [];
	let from = pos + 1;
	for (const line of tokens) {
		for (const token of line) {
			const to = from + token.content.length;
			const style = styleText(token.htmlStyle ?? `color:${token.color}`);
			decorations.push(
				Decoration.inline(from, to, { style, class: "code-token" }),
			);
			from = to;
		}
		from += 1;
	}
	return decorations;
}

function parser(options: {
	content: string;
	language?: string;
	pos: number;
}): Decoration[] | Promise<void> {
	const language = options.language ?? "";
	if (!language || language === "text" || failed) {
		return [];
	}
	if (!highlighter) {
		// Every block waits on the one import, and all are redrawn after it.
		loading ??= import("#lib/components/ui/code/shiki.js")
			.then(async (module) => {
				highlighter = await module.highlighter;
			})
			.catch(() => {
				// Offline or blocked: the code stays plain rather than breaking.
				failed = true;
			});
		return loading;
	}
	return highlight(options.content, language, options.pos);
}

/** Whether the caret sits on the last line of a code block nothing follows. */
function onTrailingCodeLine(state: EditorState): boolean {
	const { $head, empty } = state.selection;
	const block = $head.parent;
	return (
		empty &&
		block.type.spec.code === true &&
		!block.textContent.slice($head.parentOffset).includes("\n") &&
		$head.indexAfter(-1) === $head.node(-1).childCount
	);
}

/** ArrowDown out of a code block that ends the document (or its cell). */
export const leaveCodeDown: Command = (state, dispatch) =>
	onTrailingCodeLine(state) && exitCode(state, dispatch);

/**
 * Draws the block's language picker into `target`. The page supplies it, so
 * this module stays free of components and loads under `bun test`.
 */
export type LanguagePicker = (
	target: HTMLElement,
	language: string,
	pick: (language: string) => void,
) => { update: (language: string) => void; destroy: () => void };

/** The block as `<pre>`, with the picker above it, outside the text. */
function codeBlockView(picker: LanguagePicker | undefined) {
	return (
		initial: ProseMirrorNode,
		view: EditorView,
		getPos: () => number | undefined,
	) => {
		let node = initial;
		const dom = document.createElement("div");
		dom.className = "relative";
		const header = document.createElement("div");
		header.contentEditable = "false";
		header.className = "absolute end-2 top-2 z-10";
		const drawn = picker?.(
			header,
			String(node.attrs.language ?? ""),
			(language) => {
				const pos = getPos();
				if (pos !== undefined) {
					view.dispatch(
						view.state.tr.setNodeAttribute(pos, "language", language),
					);
					view.focus();
				}
			},
		);
		const pre = document.createElement("pre");
		// Room for the picker above the first line.
		pre.style.paddingTop = "2rem";
		const code = document.createElement("code");
		pre.append(code);
		dom.append(header, pre);
		return {
			dom,
			contentDOM: code,
			update(next: ProseMirrorNode) {
				if (next.type !== node.type) {
					return false;
				}
				if (next.attrs.language !== node.attrs.language) {
					drawn?.update(String(next.attrs.language ?? ""));
				}
				node = next;
				return true;
			},
			destroy: () => drawn?.destroy(),
			stopEvent: (event: Event) =>
				event.target instanceof Node && header.contains(event.target),
			ignoreMutation: (mutation: { target: Node }) =>
				header.contains(mutation.target),
		};
	};
}

export function defineCodeBlockExtras(picker?: LanguagePicker) {
	return union([
		defineCodeBlockHighlight({ parser, nodeTypes: ["codeBlock"] }),
		defineNodeView({ name: "codeBlock", constructor: codeBlockView(picker) }),
		withPriority(defineKeymap({ ArrowDown: leaveCodeDown }), Priority.high),
	]);
}
