<script lang="ts">
	import { ChevronDownIcon, PlusIcon } from "@lucide/svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Popover from "#lib/components/ui/popover/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { layoutKind, slideFromLayout } from "#lib/slides/layouts.js";
	import type { Layout } from "#lib/slides/model.js";
	import { LAYOUT_NAMES, placeholderPrompt } from "./labels.js";
	import type { RenderContext } from "./render-context.js";
	import SlideView from "./slide-view.svelte";
	import type { SlidesEditor } from "./state.svelte.js";

	/** The deck's layouts, drawn with their prompts, to start a slide from or switch one to. */
	let {
		editor,
		media,
		onPick,
		label = m.deck_add_slide(),
		current,
	}: {
		editor: SlidesEditor;
		media: RenderContext["media"];
		onPick: (part: string) => void;
		label?: string;
		/** The layout in use, marked when switching. */
		current?: string;
	} = $props();

	let open = $state(false);

	function name(layout: Layout): string {
		const kind = layoutKind(layout);
		return editor.deck.template && kind
			? LAYOUT_NAMES[kind]()
			: layout.name || layout.type;
	}

	const previews = $derived(
		editor.deck.layouts.map((layout) => ({
			layout,
			slide: slideFromLayout($state.snapshot(layout) as Layout),
		})),
	);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm" class="w-full justify-between">
				<span class="flex items-center gap-1.5">
					<PlusIcon class="size-4" />
					{label}
				</span>
				<ChevronDownIcon class="size-3 opacity-60" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="max-h-[70vh] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto p-2" align="start">
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
			{#each previews as preview (preview.layout.part)}
				<button
					type="button"
					class="hover:border-primary aria-pressed:border-primary flex flex-col gap-1 rounded-md border p-1.5 text-left"
					aria-pressed={current === preview.layout.part}
					onclick={() => {
						open = false;
						onPick(preview.layout.part);
					}}
				>
					<SlideView deck={editor.deck} slide={preview.slide} width={150} {media} prompt={placeholderPrompt} class="pointer-events-none rounded-sm border" />
					<span class="truncate text-xs">{name(preview.layout)}</span>
				</button>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
