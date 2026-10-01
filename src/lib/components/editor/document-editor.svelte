<script lang="ts">
	import {
		ArrowUpDownIcon,
		BaselineIcon,
		CheckIcon,
		HighlighterIcon,
		ImageIcon,
		KeyboardIcon,
		LinkIcon,
		MessageSquarePlusIcon,
		ReplaceIcon,
		SearchIcon,
		TableIcon,
	} from "@lucide/svelte";
	import "prosekit/basic/style.css";
	import "prosekit/basic/typography.css";
	import { createEditor, htmlFromNode, isApple, union } from "prosekit/core";
	import { defineReadonly } from "prosekit/extensions/readonly";
	import type { ProseMirrorNode } from "prosekit/pm/model";
	import { TextSelection } from "prosekit/pm/state";
	import { type Snippet, untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import {
		commentRanges,
		defineComments,
		docRuns,
		locateInDoc,
		setCommentRanges,
	} from "#lib/editor/comment-plugin.js";
	import { flatten, textAnchor } from "#lib/editor/comments.js";
	import {
		defineDocumentExtension,
		markValue,
	} from "#lib/editor/document-extension.js";
	import {
		firstFamily,
		HIGHLIGHT_COLORS,
		keyLabel,
		TEXT_COLORS,
	} from "#lib/editor/document-format.js";
	import { embedPicture } from "#lib/editor/picture.js";
	import { printElement } from "#lib/editor/print.js";
	import { defineSafeLinks } from "#lib/editor/safe-links.js";
	import { countCharacters, countWords } from "#lib/editor/word-count.js";
	import { m } from "#lib/paraglide/messages.js";
	import { APP_USER_AGENT } from "#lib/release.js";
	import { cn } from "#lib/utils.js";
	import ChoiceMenu from "./document/choice-menu.svelte";
	import ColourMenu from "./document/colour-menu.svelte";
	import FindBar from "./document/find-bar.svelte";
	import LinkPopover from "./document/link-popover.svelte";
	import ShortcutsDialog from "./document/shortcuts-dialog.svelte";
	import { documentTools, type Tool } from "./document/tools.js";
	import type { Comments } from "./shell/comments.svelte.js";
	import type { EditorMenuContext } from "./shell/file-actions.js";

	/**
	 * Rich text on top of ProseKit.
	 *
	 * Content is HTML in and HTML out: a `.docx` is converted to it and back
	 * by the server, and an older `.html` document is the file itself.
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
		readOnly = false,
		menu,
		comments,
	}: {
		content: string;
		onChange: (html: string) => void;
		/** Reading only: no toolbar, no editing menus, live (safe) links. */
		readOnly?: boolean;
		/** The shared File menu, first in the menu bar. */
		menu?: Snippet<[EditorMenuContext]>;
		/** Threads to mark in the text, and where new ones start. */
		comments?: Comments;
	} = $props();

	/** Bumped on every transaction, so the toolbar re-reads what is active. */
	let revision = $state(0);
	let words = $state(0);
	let characters = $state(0);
	let counting: ReturnType<typeof setTimeout> | undefined;

	/** Counting walks the whole text; once typing pauses is soon enough. */
	function recount(doc: ProseMirrorNode, delay = 300) {
		clearTimeout(counting);
		counting = setTimeout(() => {
			const text = doc.textBetween(0, doc.content.size, "\n", " ");
			words = countWords(text);
			characters = countCharacters(text);
		}, delay);
	}

	let linkOpen = $state(false);
	let findOpen = $state(false);
	let replacing = $state(false);
	let findRequest = $state(0);
	let shortcutsOpen = $state(false);

	function openFind(replace: boolean) {
		findOpen = true;
		replacing ||= replace;
		findRequest++;
	}

	/**
	 * What a menu entry opens once the menu is gone. Opened straight away,
	 * the find bar or the link popover took the focus and the closing menu
	 * handed it back to the text a moment later.
	 */
	let afterMenu: (() => void) | null = null;
	const later = (open: () => void) => () => {
		afterMenu = open;
	};

	const editor = createEditor({
		extension: defineDocumentExtension({
			// Serialising on every keystroke would rebuild the whole document;
			// the parent debounces the actual save, this only reports the text.
			onDocChange: (doc) => {
				onChange(htmlFromNode(doc));
				recount(doc);
				syncDetached();
			},
			onUpdate: () => {
				revision++;
				const { from, to } = editor.state.selection;
				if (from < to) {
					lastSelection = { from, to };
				}
			},
			// The browser's own find and print would search and print the app.
			keys: {
				"Mod-f": () => openFind(false),
				"Mod-Shift-h": () => openFind(true),
				"Ctrl-h": () => openFind(true),
				"Mod-k": () => (linkOpen = true),
				"Mod-p": printDocument,
				"Mod-Alt-m": requestComment,
			},
		}),
		// A string is parsed as HTML, which is exactly what the file holds.
		defaultContent: untrack(() => content) || "<p></p>",
	});
	recount(editor.state.doc, 0);

	let mounted = $state(false);

	/** ProseMirror attaches to this element; without it the box stays empty. */
	function mount(node: HTMLElement) {
		editor.mount(node);
		revision++;
		mounted = true;
		return {
			destroy: () => {
				clearTimeout(counting);
				editor.unmount();
			},
		};
	}

	const commands = editor.commands;
	const refocus = () => editor.focus();

	/**
	 * Printing and downloading a blob need a print dialog and a download
	 * manager, which the mobile app's web view has neither of.
	 */
	const inBrowser = !navigator.userAgent.includes(APP_USER_AGENT);

	function printDocument() {
		if (inBrowser && editor.mounted) {
			void printElement(editor.view.dom, document.title);
		}
	}

	// Reading: nothing can change the text, and links open (when safe).
	$effect(() => {
		if (readOnly) {
			return editor.use(union([defineReadonly(), defineSafeLinks()]));
		}
	});

	// =====================================================================
	// Comments
	// =====================================================================

	if (untrack(() => comments)) {
		editor.use(defineComments((id) => comments?.open(id)));
	}

	/**
	 * The last text selected, for reading on a phone: tapping a button can
	 * clear the selection before the tap arrives.
	 */
	let lastSelection: { from: number; to: number } | null = null;

	function selectedRange(): { from: number; to: number } | null {
		const { from, to } = editor.state.selection;
		if (from < to) {
			return { from, to };
		}
		// Read-only: the browser's own selection, when ProseMirror's is empty.
		const native = window.getSelection();
		if (
			editor.mounted &&
			native &&
			!native.isCollapsed &&
			native.anchorNode &&
			native.focusNode &&
			editor.view.dom.contains(native.anchorNode)
		) {
			const a = editor.view.posAtDOM(native.anchorNode, native.anchorOffset);
			const b = editor.view.posAtDOM(native.focusNode, native.focusOffset);
			return { from: Math.min(a, b), to: Math.max(a, b) };
		}
		return readOnly ? lastSelection : null;
	}

	function requestComment() {
		if (!comments) {
			return;
		}
		const range = selectedRange();
		const flat = flatten(docRuns(editor.state.doc));
		const anchor = range
			? textAnchor(
					flat.text,
					flat.toOffset(range.from),
					flat.toOffset(range.to),
				)
			: null;
		if (anchor) {
			comments.start(anchor);
		} else {
			toast.info(m.shell_select_text());
		}
	}

	/** Threads whose text is no longer in the document. */
	function syncDetached() {
		if (!comments) {
			return;
		}
		const placed = new Set(commentRanges(editor.state).map((r) => r.id));
		const gone = comments.unresolved
			.filter((t) => t.root.anchor?.kind === "text" && !placed.has(t.root.id))
			.map((t) => t.root.id);
		const known = comments.detached;
		if (gone.length !== known.size || gone.some((id) => !known.has(id))) {
			comments.detached = new Set(gone);
		}
	}

	// Found again from their quotes whenever the threads change.
	$effect(() => {
		const threads = comments?.unresolved;
		if (!(threads && mounted)) {
			return;
		}
		untrack(() => {
			const ranges = threads.flatMap(({ root }) => {
				const found =
					root.anchor?.kind === "text"
						? locateInDoc(editor.state.doc, root.anchor)
						: null;
				return found ? [{ id: root.id, ...found }] : [];
			});
			setCommentRanges(editor.view, ranges, comments?.active ?? null);
			syncDetached();
		});
	});

	$effect(() => {
		const active = comments?.active ?? null;
		if (mounted && comments) {
			untrack(() => {
				const ranges = commentRanges(editor.state);
				setCommentRanges(editor.view, ranges, active);
			});
		}
	});

	// A thread picked in the panel: its text scrolls into view.
	$effect(() => {
		const request = comments?.reveal;
		if (!(request && mounted)) {
			return;
		}
		untrack(() => {
			const anchor = comments?.all.find((t) => t.root.id === request.id)?.root
				.anchor;
			const range =
				commentRanges(editor.state).find((r) => r.id === request.id) ??
				(anchor?.kind === "text"
					? locateInDoc(editor.state.doc, anchor)
					: null);
			if (!range) {
				return;
			}
			const { node } = editor.view.domAtPos(range.from);
			const element = node instanceof Element ? node : node.parentElement;
			element?.scrollIntoView({ block: "center", behavior: "smooth" });
		});
	});

	/** Rebuilt on every transaction, so what is active is read again. */
	const tools = $derived.by(() => {
		void revision;
		return documentTools(editor, insertTableHere);
	});

	const inTable = $derived.by(() => {
		void revision;
		return editor.nodes.table.isActive();
	});

	const linkActive = $derived.by(() => {
		void revision;
		return editor.marks.link.isActive();
	});

	/** The size the text at the caret is drawn at, when no mark says. */
	function drawnSize(): string {
		if (!editor.mounted) {
			return "";
		}
		const { node } = editor.view.domAtPos(editor.state.selection.from);
		const element = node instanceof Element ? node : node.parentElement;
		const pixels = element
			? Number.parseFloat(getComputedStyle(element).fontSize)
			: 0;
		return pixels > 0 ? String(Math.round(pixels * 1.5) / 2) : "";
	}

	/** What the selection carries, for the dropdowns and the swatches. */
	const current = $derived.by(() => {
		void revision;
		const { state } = editor;
		const font = markValue(state, "fontFamily", "family");
		const size = markValue(state, "fontSize", "size");
		return {
			style: tools.styles.find((tool) => tool.active?.())?.label,
			font: font ? firstFamily(font) : m.doc_default(),
			size: size ? size.replace(/pt$/, "") : drawnSize(),
			colour: markValue(state, "textColor", "color"),
			highlight: markValue(state, "backgroundColor", "color"),
		};
	});

	/** ProseKit leaves the caret after a new table; start in its first cell. */
	function insertTableHere() {
		const from = editor.state.selection.from;
		commands.insertTable({ row: 3, col: 3, header: true });
		const { doc } = editor.state;
		let table = -1;
		doc.descendants((node, pos) => {
			if (table < 0 && node.type.name === "table" && pos >= from - 2) {
				table = pos;
			}
			return table < 0;
		});
		if (table >= 0) {
			const selection = TextSelection.near(doc.resolve(table + 1));
			editor.view.dispatch(editor.state.tr.setSelection(selection));
		}
	}

	let picker = $state<HTMLInputElement>();

	async function insertPicture(files: FileList | null) {
		const file = files?.[0];
		if (!file) {
			return;
		}
		try {
			commands.insertImage({ src: await embedPicture(file) });
		} catch {
			toast.error(m.editor_image_error());
		}
		if (picker) {
			picker.value = "";
		}
	}

	const button = cn(toggleVariants({ size: "sm" }), "shrink-0");
</script>

{#snippet tool(item: Tool)}
	{@const Icon = item.icon}
	{@const on = item.active?.() ?? false}
	<button
		type="button"
		class={button}
		data-state={on ? "on" : "off"}
		aria-pressed={item.active ? on : undefined}
		aria-label={item.label}
		title={item.label}
		disabled={item.disabled?.()}
		onmousedown={(e) => e.preventDefault()}
		onclick={() => item.run()}
	>
		{#if Icon}
			<Icon class="size-4" />
		{/if}
	</button>
{/snippet}

{#snippet separator()}
	<div class="bg-border mx-0.5 h-5 w-px shrink-0"></div>
{/snippet}

{#snippet entry(item: Tool, disabled = false)}
	{@const Icon = item.icon}
	<Menubar.Item
		disabled={disabled || item.disabled?.()}
		onSelect={() => item.run()}
	>
		{#if Icon}
			<Icon class="size-4" />
		{/if}
		{item.label}
		{#if item.active?.()}
			<CheckIcon class="text-primary ms-auto size-4" />
		{:else if item.shortcut}
			<Menubar.Shortcut>{keyLabel(item.shortcut, isApple)}</Menubar.Shortcut>
		{/if}
	</Menubar.Item>
{/snippet}

{#snippet action(label: string, Icon: typeof LinkIcon, run: () => void, shortcut?: string)}
	{@render entry({ label, icon: Icon, run, shortcut })}
{/snippet}

{#snippet section(label: string, body: Snippet)}
	<Menubar.Menu>
		<Menubar.Trigger>{label}</Menubar.Trigger>
		<!-- Back to the text once a command ran, not to the menu's trigger. -->
		<Menubar.Content
			onCloseAutoFocus={(e: Event) => {
				e.preventDefault();
				const next = afterMenu;
				afterMenu = null;
				if (next) {
					next();
				} else {
					editor.focus();
				}
			}}
		>
			{@render body()}
		</Menubar.Content>
	</Menubar.Menu>
{/snippet}

{#snippet submenu(label: string, items: Tool[])}
	<Menubar.Sub>
		<Menubar.SubTrigger>{label}</Menubar.SubTrigger>
		<Menubar.SubContent>
			{#each items as item (item.label)}
				{@render entry(item)}
			{/each}
		</Menubar.SubContent>
	</Menubar.Sub>
{/snippet}

{#snippet editMenu()}
	{#each tools.history as item (item.label)}
		{@render entry(item)}
	{/each}
	<Menubar.Separator />
	{@render action(
		m.doc_find(),
		SearchIcon,
		later(() => openFind(false)),
		"Mod-f",
	)}
	{@render action(
		m.doc_find_replace(),
		ReplaceIcon,
		later(() => openFind(true)),
		"Mod-Shift-h",
	)}
{/snippet}

{#snippet insertMenu()}
	{@render action(
		m.editor_link(),
		LinkIcon,
		later(() => (linkOpen = true)),
		"Mod-k",
	)}
	{@render action(m.editor_image(), ImageIcon, () => picker?.click())}
	{#if comments}
		{@render action(
			m.shell_add_comment(),
			MessageSquarePlusIcon,
			later(requestComment),
			"Mod-Alt-m",
		)}
	{/if}
	<Menubar.Separator />
	{#each tools.blocks as item (item.label)}
		{@render entry(item)}
	{/each}
{/snippet}

{#snippet formatMenu()}
	{#each [...tools.marks, ...tools.scripts] as item (item.label)}
		{@render entry(item)}
	{/each}
	<Menubar.Separator />
	{@render submenu(m.editor_text_style(), tools.styles)}
	{@render submenu(m.editor_align(), [...tools.alignments, ...tools.indents])}
	{@render submenu(m.doc_line_spacing(), tools.spacing)}
	{@render submenu(m.editor_lists(), tools.lists)}
	<Menubar.Separator />
	{@render entry(tools.clear)}
{/snippet}

{#snippet tableMenu()}
	{@render action(m.editor_table(), TableIcon, insertTableHere)}
	<Menubar.Separator />
	{#each tools.table as item (item.label)}
		{@render entry(item, !inTable)}
	{/each}
{/snippet}

{#snippet helpMenu()}
	{@render action(
		m.doc_shortcuts(),
		KeyboardIcon,
		later(() => (shortcutsOpen = true)),
	)}
{/snippet}

<div class="flex min-h-0 flex-1 flex-col gap-2">
	<div class="flex items-center gap-2">
		<Menubar.Root class="w-fit max-w-full overflow-x-auto">
			{@render menu?.({ print: inBrowser ? printDocument : undefined })}
			{#if !readOnly}
				{@render section(m.menu_edit(), editMenu)}
				{@render section(m.menu_insert(), insertMenu)}
				{@render section(m.menu_format(), formatMenu)}
				{@render section(m.menu_table(), tableMenu)}
			{/if}
			{@render section(m.doc_menu_help(), helpMenu)}
		</Menubar.Root>
		{#if readOnly}
			<!-- Reading still searches, and still comments. -->
			<button
				type="button"
				class={button}
				aria-label={m.doc_find()}
				title={m.doc_find()}
				onclick={() => openFind(false)}
			>
				<SearchIcon class="size-4" />
			</button>
			{#if comments}
				{@render commentButton()}
			{/if}
		{/if}
	</div>

	{#snippet commentButton()}
		<button
			type="button"
			class={cn(button, "gap-1.5 px-2")}
			aria-label={m.shell_add_comment()}
			title={m.shell_add_comment()}
			onmousedown={(e) => e.preventDefault()}
			onclick={requestComment}
		>
			<MessageSquarePlusIcon class="size-4" />
		</button>
	{/snippet}

	<!-- One scrolling row on a phone, wrapped from `sm` up. -->
	<div
		class={cn(
			"flex items-center gap-1 overflow-x-auto rounded-lg border p-1 sm:flex-wrap sm:overflow-visible",
			readOnly && "hidden",
		)}
	>
		{#each tools.history as item (item.label)}
			{@render tool(item)}
		{/each}
		{@render separator()}
		<ChoiceMenu
			label={m.editor_text_style()}
			text={current.style ?? m.editor_text_style()}
			class="w-32"
			items={tools.styles}
			onClose={refocus}
		/>
		<ChoiceMenu
			label={m.doc_font()}
			text={current.font}
			class="w-32"
			items={tools.fonts}
			onClose={refocus}
		/>
		<ChoiceMenu
			label={m.doc_font_size()}
			text={current.size}
			class="w-16"
			items={tools.sizes}
			onClose={refocus}
		/>
		{@render separator()}
		{#each tools.marks as item (item.label)}
			{@render tool(item)}
		{/each}
		<ColourMenu
			label={m.doc_text_colour()}
			icon={BaselineIcon}
			colours={TEXT_COLORS}
			current={current.colour}
			none={m.doc_default()}
			onPick={(colour) =>
				commands.setMark("textColor", colour ? { color: colour } : null)}
			onClose={refocus}
		/>
		<ColourMenu
			label={m.doc_highlight()}
			icon={HighlighterIcon}
			colours={HIGHLIGHT_COLORS}
			current={current.highlight}
			none={m.doc_colour_none()}
			onPick={(colour) =>
				commands.setMark(
					"backgroundColor",
					colour ? { color: colour } : null,
				)}
			onClose={refocus}
		/>
		{@render separator()}
		<LinkPopover {editor} active={linkActive} bind:open={linkOpen} class={button} />
		<button
			type="button"
			class={button}
			aria-label={m.editor_image()}
			title={m.editor_image()}
			onmousedown={(e) => e.preventDefault()}
			onclick={() => picker?.click()}
		>
			<ImageIcon class="size-4" />
		</button>
		<input
			bind:this={picker}
			type="file"
			accept="image/*"
			class="hidden"
			onchange={(e) => void insertPicture(e.currentTarget.files)}
		/>
		{@render separator()}
		{#each tools.alignments as item (item.label)}
			{@render tool(item)}
		{/each}
		<ChoiceMenu
			label={m.doc_line_spacing()}
			icon={ArrowUpDownIcon}
			items={tools.spacing}
			onClose={refocus}
		/>
		{@render separator()}
		{#each [...tools.lists, ...tools.indents] as item (item.label)}
			{@render tool(item)}
		{/each}
		{@render separator()}
		{#each tools.blocks as item (item.label)}
			{@render tool(item)}
		{/each}
		{@render tool(tools.clear)}
		{#if inTable}
			{@render separator()}
			{#each tools.table as item (item.label)}
				{@render tool(item)}
			{/each}
		{/if}
		{#if comments}
			{@render separator()}
			{@render commentButton()}
		{/if}
	</div>

	{#if findOpen}
		<FindBar
			{editor}
			{revision}
			request={findRequest}
			bind:replacing
			onClose={() => {
				findOpen = false;
				editor.focus();
			}}
		/>
	{/if}

	<!-- From `md` up the text sits on a page: a reading measure is the one
	     place a width cap is the point rather than a reflex. -->
	<div class="md:bg-muted min-h-0 flex-1 overflow-auto rounded-lg border">
		<div
			class="flex min-h-full flex-col md:bg-surface-base md:mx-auto md:my-8 md:min-h-264 md:max-w-204 md:rounded-sm md:border md:shadow-md"
		>
			<div
				use:mount
				class="comment-host relative box-border flex-1 px-4 py-4 outline-none sm:px-6 sm:py-5 md:px-16 md:py-14 **:data-background-color:text-black [&_[data-text-color]_[data-background-color]]:text-inherit [&_.ProseMirror-search-match]:bg-primary/20 [&_.ProseMirror-active-search-match]:bg-primary/50! [&_blockquote]:border-s-2 [&_blockquote]:ps-3 [&_code]:font-mono [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-1.5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-4 [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-2 [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-3 [&_table]:my-3 [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:ps-6"
			></div>
		</div>
	</div>

	<p class="text-muted-foreground text-end text-xs tabular-nums">
		{m.doc_words({ count: String(words) })} · {m.doc_characters({
			count: String(characters),
		})}
	</p>
</div>

<ShortcutsDialog bind:open={shortcutsOpen} />

<style>
	/* A comment's text, tinted; the thread in focus, more so. */
	.comment-host :global(.comment-mark) {
		background: color-mix(in oklab, var(--primary) 18%, transparent);
		border-bottom: 2px solid color-mix(in oklab, var(--primary) 55%, transparent);
		cursor: pointer;
	}
	.comment-host :global(.comment-mark-active) {
		background: color-mix(in oklab, var(--primary) 32%, transparent);
	}
	/* In the page's right margin, level with the comment's first line: an
	   absolute box with no top stays where its line put it. */
	.comment-host :global(.comment-marker) {
		position: absolute;
		right: 0.25rem;
		width: 0.75rem;
		height: 0.75rem;
		margin-top: 0.3rem;
		border-radius: 9999px 9999px 9999px 0;
		background: var(--primary);
		cursor: pointer;
	}
	@media (min-width: 48rem) {
		.comment-host :global(.comment-marker) {
			right: 1.5rem;
		}
	}

	/* Shiki's dark theme rides along in `--shiki-dark` on every token. */
	:global(.dark .code-token) {
		color: var(--shiki-dark) !important;
		font-style: var(--shiki-dark-font-style) !important;
		font-weight: var(--shiki-dark-font-weight) !important;
	}
</style>
