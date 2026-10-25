import { marked } from "marked";
import { definePlugin, union } from "prosekit/core";
import { defineInputRule } from "prosekit/extensions/input-rule";
import { InputRule } from "prosekit/pm/inputrules";
import { DOMParser as SchemaParser } from "prosekit/pm/model";
import { Plugin } from "prosekit/pm/state";

import { linkTarget } from "./document-format";

const BLOCK = /^(#{1,6} |[-*+] |\d{1,3}[.)] |> |```|~~~|\|.*\|\s*$)/m;
const INLINE =
	/\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|~~[^~\n]+~~/;

/** Whether pasted plain text is worth reading as Markdown. */
export function looksLikeMarkdown(text: string): boolean {
	return BLOCK.test(text) || INLINE.test(text);
}

/**
 * A page or a document pastes its own structure; a code editor pastes
 * coloured spans around the Markdown source, which is still the source.
 */
const STRUCTURE = /<(h[1-6]|ul|ol|strong|b|em|a|table|blockquote)\b/i;

/** Fence names people type, as the code block's language list spells them. */
const LANGUAGE_ALIASES: Record<string, string> = {
	js: "javascript",
	jsx: "javascript",
	ts: "typescript",
	tsx: "typescript",
	sh: "bash",
	shell: "bash",
	zsh: "bash",
	py: "python",
	rb: "ruby",
	rs: "rust",
	kt: "kotlin",
	yml: "yaml",
	md: "markdown",
	"c++": "cpp",
	cs: "csharp",
	golang: "go",
};

export function markdownToHtml(text: string): string {
	return marked
		.parse(text, { async: false, gfm: true })
		.replace(
			/class="language-([^"]+)"/g,
			(_, name: string) =>
				`class="language-${LANGUAGE_ALIASES[name.toLowerCase()] ?? name}"`,
		);
}

/** `[text](url)` typed out becomes a link once the `)` is typed. */
const linkRule = new InputRule(
	/\[([^\]\n]+)\]\(([^)\s]+)\)$/,
	(state, match, start, end) => {
		const [, text, target] = match;
		const href = target ? linkTarget(target) : null;
		const type = state.schema.marks.link;
		if (!(text && href && type)) {
			return null;
		}
		const mark = type.create({ href });
		const marks = mark.addToSet(state.doc.resolve(start).marks());
		return state.tr
			.replaceWith(start, end, state.schema.text(text, marks))
			.removeStoredMark(type);
	},
);

/**
 * Markdown pasted as plain text arrives formatted. ⌘⇧V and a paste inside
 * a code block stay plain, as they would anywhere else.
 */
function markdownPaste() {
	let plain = false;
	return new Plugin({
		props: {
			handleDOMEvents: {
				keydown: (_view, event) => {
					plain =
						(event.metaKey || event.ctrlKey) &&
						event.shiftKey &&
						event.key.toLowerCase() === "v";
					return false;
				},
			},
			handlePaste: (view, event) => {
				const wasPlain = plain;
				plain = false;
				const text = event.clipboardData?.getData("text/plain") ?? "";
				const html = event.clipboardData?.getData("text/html") ?? "";
				const { $from } = view.state.selection;
				if (
					wasPlain ||
					$from.parent.type.spec.code ||
					!looksLikeMarkdown(text) ||
					STRUCTURE.test(html)
				) {
					return false;
				}
				// An inert document: nothing in it loads or runs.
				const body = new window.DOMParser().parseFromString(
					markdownToHtml(text),
					"text/html",
				).body;
				const slice = SchemaParser.fromSchema(view.state.schema).parseSlice(
					body,
				);
				view.dispatch(
					view.state.tr
						.replaceSelection(slice)
						.scrollIntoView()
						.setMeta("paste", true)
						.setMeta("uiEvent", "paste"),
				);
				return true;
			},
		},
	});
}

export function defineMarkdown() {
	return union(defineInputRule(linkRule), definePlugin(markdownPaste()));
}
