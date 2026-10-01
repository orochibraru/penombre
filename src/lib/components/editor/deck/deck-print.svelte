<script lang="ts">
	import { Portal } from "bits-ui";
	import type { Deck, SlideLook, ThemeName } from "#lib/deck/format.js";
	import SlideView from "./slide-view.svelte";

	/**
	 * Every slide, one per printed page. Mounted on `body` so the print
	 * stylesheet can hide the rest of the app beside it.
	 */
	let {
		deck,
		looks,
		theme,
	}: { deck: Deck; looks: SlideLook[]; theme: ThemeName } = $props();
</script>

<Portal>
    <div class="deck-print">
        {#each deck.slides as slide, index (index)}
            <SlideView {slide} look={looks[index]} {theme} number={index + 1} />
        {/each}
    </div>
</Portal>
