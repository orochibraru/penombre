<script lang="ts">
	import {
		BaselineIcon,
		HighlighterIcon,
		MessageSquarePlusIcon,
	} from "@lucide/svelte";
	import { TextSelection } from "prosekit/pm/state";
	import { MediaQuery } from "svelte/reactivity";

	import * as Popover from "#lib/components/ui/popover/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import type { DocumentEditor } from "#lib/editor/document-extension.js";
	import {
		HIGHLIGHT_COLORS,
		TEXT_COLORS,
	} from "#lib/editor/document-format.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";

	import ChoiceMenu from "./choice-menu.svelte";
	import ColourMenu from "./colour-menu.svelte";
	import LinkPopover from "./link-popover.svelte";
	import type { documentTools, Tool } from "./tools.js";

	/** Formatting over a text selection, the toolbar's own tools. */
	const {
		editor,
		revision,
		tools,
		current,
		linkActive,
		paused,
		onComment,
	}: {
		editor: DocumentEditor;
		/** Bumped on every transaction: the selection is read again. */
		revision: number;
		tools: ReturnType<typeof documentTools>;
		current: {
			style?: string;
			colour: string | null;
			highlight: string | null;
		};
		linkActive: boolean;
		/** Read-only, or another card is up. */
		paused: boolean;
		onComment?: () => void;
	} = $props();

	/** While the pointer is still selecting, the bar waits for it to let go. */
	let selecting = $state(false);
	/** The range the bar was dismissed on; a new selection brings it back. */
	let dismissed = $state<string | null>(null);
	let linkOpen = $state(false);
	// A phone draws its own copy menu above the selection: go below it.
	const touch = new MediaQuery("pointer: coarse");

	const range = $derived.by(() => {
		void revision;
		if (paused || selecting || !editor.mounted) {
			return null;
		}
		const { selection } = editor.state;
		if (
			!(selection instanceof TextSelection) ||
			selection.empty ||
			editor.nodes.codeBlock.isActive()
		) {
			return null;
		}
		return { from: selection.from, to: selection.to };
	});
	const key = $derived(range ? `${range.from}:${range.to}` : null);

	const anchor = $derived.by(() => {
		const at = range;
		return {
			getBoundingClientRect: (): DOMRect => {
				if (!(at && editor.mounted)) {
					return new DOMRect();
				}
				const size = editor.state.doc.content.size;
				const a = editor.view.coordsAtPos(Math.min(at.from, size));
				const b = editor.view.coordsAtPos(Math.min(at.to, size));
				const left = Math.min(a.left, b.left);
				const top = Math.min(a.top, b.top);
				return new DOMRect(
					left,
					top,
					Math.max(1, Math.max(a.right, b.right) - left),
					Math.max(a.bottom, b.bottom) - top,
				);
			},
		};
	});

	const refocus = () => editor.focus();
	const button = cn(toggleVariants({ size: "sm" }), "shrink-0");
</script>

<svelte:window
	onpointerdown={(e) => {
		selecting =
			editor.mounted &&
			e.target instanceof Node &&
			editor.view.dom.contains(e.target);
	}}
	onpointerup={() => (selecting = false)}
	onpointercancel={() => (selecting = false)}
/>

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

<!-- Never takes the focus: the selection it acts on must stay put. -->
<Popover.Root
	bind:open={
		() => key !== null && key !== dismissed,
		(open) => !open && (dismissed = key)
	}
>
	<Popover.Content
		customAnchor={anchor}
		side={touch.current ? "bottom" : "top"}
		sideOffset={8}
		trapFocus={false}
		onOpenAutoFocus={(e: Event) => e.preventDefault()}
		onCloseAutoFocus={(e: Event) => e.preventDefault()}
		role="toolbar"
		aria-label={m.doc_selection_toolbar()}
		class="flex w-auto max-w-[calc(100vw-1rem)] items-center gap-0.5 overflow-x-auto p-1"
	>
		<ChoiceMenu
			label={m.editor_text_style()}
			text={current.style ?? m.editor_text_style()}
			class="w-28"
			items={tools.styles}
			onClose={refocus}
		/>
		{@render separator()}
		{#each tools.marks as item (item.label)}
			{@render tool(item)}
		{/each}
		{#each tools.scripts.slice(0, 1) as item (item.label)}
			{@render tool(item)}
		{/each}
		<ColourMenu
			label={m.doc_text_colour()}
			icon={BaselineIcon}
			colours={TEXT_COLORS}
			current={current.colour}
			none={m.doc_default()}
			onPick={(colour) =>
				editor.commands.setMark("textColor", colour ? { color: colour } : null)}
			onClose={refocus}
		/>
		<ColourMenu
			label={m.doc_highlight()}
			icon={HighlighterIcon}
			colours={HIGHLIGHT_COLORS}
			current={current.highlight}
			none={m.doc_colour_none()}
			onPick={(colour) =>
				editor.commands.setMark(
					"backgroundColor",
					colour ? { color: colour } : null,
				)}
			onClose={refocus}
		/>
		{@render separator()}
		<LinkPopover
			{editor}
			active={linkActive}
			bind:open={linkOpen}
			class={button}
		/>
		{#if onComment}
			<button
				type="button"
				class={button}
				aria-label={m.shell_add_comment()}
				title={m.shell_add_comment()}
				onmousedown={(e) => e.preventDefault()}
				onclick={onComment}
			>
				<MessageSquarePlusIcon class="size-4" />
			</button>
		{/if}
		{@render tool(tools.clear)}
	</Popover.Content>
</Popover.Root>
