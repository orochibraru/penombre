<script lang="ts">
	import { defineBasicExtension } from "prosekit/basic";
	import "prosekit/basic/style.css";
	import "prosekit/basic/typography.css";
	import {
		BoldIcon,
		Heading1Icon,
		Heading2Icon,
		ItalicIcon,
		ListIcon,
		ListOrderedIcon,
		StrikethroughIcon,
	} from "@lucide/svelte";
	import {
		createEditor,
		defineDocChangeHandler,
		htmlFromNode,
		union,
	} from "prosekit/core";
	import { untrack } from "svelte";
	import { Toggle } from "$lib/components/ui/toggle/index.js";

	/**
	 * Rich text on top of ProseKit.
	 *
	 * Content is HTML in and HTML out: the file on disk is a plain `.html`
	 * document that any browser or editor opens, so nothing here is a format
	 * only Penombre can read.
	 *
	 * Deliberately built from `prosekit/core` alone — no `<ProseKit>` wrapper
	 * and no `use*` hooks. Those exist to supply editor context to node views
	 * and menu components, neither of which this uses, and the context is set
	 *inside* the wrapper: a hook called in this scope cannot see it and
	 * throws `EditorNotFoundError` at runtime. An extension has no such
	 * problem, and it keeps the uncompiled `@prosekit/svelte` sources out of
	 * the bundle entirely.
	 */
	let {
		content,
		onChange,
	}: { content: string; onChange: (html: string) => void } = $props();

	// untrack: the editor owns the document once it is built, so re-reading
	// `content` here would fight the user's typing on every save round-trip.
	const editor = createEditor({
		extension: union([
			defineBasicExtension(),
			// Serialising on every keystroke would rebuild the whole document;
			// the parent debounces the actual save, this only reports the text.
			defineDocChangeHandler((view) => onChange(htmlFromNode(view.state.doc))),
		]),
		// A string is parsed as HTML, which is exactly what the file holds.
		defaultContent: untrack(() => content) || "<p></p>",
	});

	/** ProseMirror attaches to this element; without it the box stays empty. */
	function mount(node: HTMLElement) {
		editor.mount(node);
		return {
			destroy: () => editor.unmount(),
		};
	}

	const commands = $derived(editor.commands);

	/** Toolbar entries, kept declarative so the markup stays a single loop. */
	const tools = $derived([
		{ label: "Bold", icon: BoldIcon, run: () => commands.toggleBold() },
		{ label: "Italic", icon: ItalicIcon, run: () => commands.toggleItalic() },
		{
			label: "Strikethrough",
			icon: StrikethroughIcon,
			run: () => commands.toggleStrike(),
		},
		{
			label: "Heading 1",
			icon: Heading1Icon,
			run: () => commands.toggleHeading({ level: 1 }),
		},
		{
			label: "Heading 2",
			icon: Heading2Icon,
			run: () => commands.toggleHeading({ level: 2 }),
		},
		{
			label: "Bullet list",
			icon: ListIcon,
			run: () => commands.toggleList({ kind: "bullet" }),
		},
		{
			label: "Numbered list",
			icon: ListOrderedIcon,
			run: () => commands.toggleList({ kind: "ordered" }),
		},
	]);
</script>

<div class="flex min-h-0 flex-1 flex-col gap-2">
    <div class="flex flex-wrap items-center gap-1 rounded-lg border p-1">
        {#each tools as tool (tool.label)}
            {@const Icon = tool.icon}
            <Toggle size="sm" aria-label={tool.label} title={tool.label} onclick={() => tool.run()}>
                <Icon class="size-4" />
            </Toggle>
        {/each}
    </div>

    <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
        <div
            use:mount
            class="box-border min-h-full px-6 py-5 outline-none [&_blockquote]:border-s-2 [&_blockquote]:ps-3 [&_code]:font-mono [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-1.5 [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:ps-6"
        ></div>
    </div>
</div>
