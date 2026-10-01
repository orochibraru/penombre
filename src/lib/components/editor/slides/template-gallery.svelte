<script lang="ts">
	import { CheckIcon } from "@lucide/svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { slideFromLayout } from "#lib/slides/layouts.js";
	import type { Deck, Slide } from "#lib/slides/model.js";
	import { TEMPLATE_IDS, templateDeck } from "#lib/slides/templates/index.js";
	import { cn } from "#lib/utils.js";
	import { TEMPLATE_NAMES } from "./labels.js";
	import SlideView from "./slide-view.svelte";

	/**
	 * Every template as its title slide, large, with three of its layouts
	 * under it — drawn by the editor's own renderer, so the preview is the
	 * deck, not a picture of one.
	 */
	let { selected = $bindable() }: { selected: string } = $props();

	const none = () => null;

	function samples(deck: Deck): Slide[] {
		const [title, , content, , , , quote, number] = deck.layouts;
		const filled: [typeof title, Record<string, string[]>][] = [
			[
				title,
				{ title: [m.slides_sample_title()], sub: [m.slides_sample_subtitle()] },
			],
			[
				content,
				{
					title: [m.slides_sample_heading()],
					1: [
						m.slides_sample_point_1(),
						m.slides_sample_point_2(),
						m.slides_sample_point_3(),
					],
				},
			],
			[number, { 1: ["87%"], 2: [m.slides_sample_caption()] }],
			[quote, { 1: [m.slides_sample_quote()], 2: [m.slides_sample_author()] }],
		];
		return filled.flatMap(([layout, content]) =>
			layout ? [slideFromLayout(layout, content)] : [],
		);
	}

	const templates = TEMPLATE_IDS.map((id) => {
		const deck = templateDeck(id) as Deck;
		return { id, deck, slides: samples(deck) };
	});

	let cardWidth = $state(280);
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label={m.slides_choose_template()}>
	{#each templates as template (template.id)}
		{@const [first, ...rest] = template.slides}
		<button
			type="button"
			role="radio"
			aria-checked={selected === template.id}
			class={cn(
				"group hover:border-primary/60 relative flex min-w-0 flex-col gap-2 rounded-xl border p-2 text-left transition-colors",
				selected === template.id && "border-primary ring-primary/30 ring-2",
			)}
			onclick={() => (selected = template.id)}
		>
			<div class="w-full" bind:clientWidth={cardWidth}>
				{#if first}
					<SlideView deck={template.deck} slide={first} width={cardWidth} media={none} class="rounded-md shadow-sm" />
				{/if}
			</div>
			<div class="grid grid-cols-3 gap-1.5">
				{#each rest as slide (slide.id)}
					<SlideView deck={template.deck} {slide} width={(cardWidth - 12) / 3} media={none} class="rounded-sm border" />
				{/each}
			</div>
			<span class="flex items-center justify-between px-0.5 text-sm font-medium">
				{TEMPLATE_NAMES[template.id]?.() ?? template.id}
				{#if selected === template.id}
					<CheckIcon class="text-primary size-4" />
				{/if}
			</span>
		</button>
	{/each}
</div>
