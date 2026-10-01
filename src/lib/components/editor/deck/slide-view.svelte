<script lang="ts">
	import "./deck.css";
	import {
		classTokens,
		type Slide,
		type SlideLook,
		type ThemeName,
	} from "#lib/deck/format.js";
	import { renderInline, renderSlide } from "#lib/deck/render.js";
	import { cn } from "#lib/utils.js";

	/**
	 * One slide, letterboxed to fill its frame. The frame needs a definite
	 * size (a flex child, `aspect-video`, …): it is a size container.
	 */
	let {
		slide,
		look,
		theme,
		number,
		inert = false,
		class: className,
	}: {
		slide: Slide;
		look: SlideLook | undefined;
		theme: ThemeName;
		number: number;
		/** Thumbnails: links inside are not reachable. */
		inert?: boolean;
		class?: string;
	} = $props();

	/** Only the theme's own classes: a deck must not reach the app's CSS. */
	const KNOWN = new Set(["lead", "invert", "gaia"]);

	const rendered = $derived(renderSlide(slide.body));
	const classes = $derived(
		classTokens(look?.className ?? "")
			.filter((token) => KNOWN.has(token))
			.map((token) => `deck-${token}`),
	);
</script>

<div class={cn("deck-frame", className)} {inert} aria-hidden={inert || undefined}>
    <section
        class={cn(
            "deck-slide",
            `deck-theme-${theme}`,
            classes,
            rendered.split && `deck-split-${rendered.split}`,
        )}
    >
        {#if rendered.backgrounds.length > 0}
            <div class="deck-backgrounds">
                {#each rendered.backgrounds as background, index (index)}
                    <img
                        src={background.src}
                        alt=""
                        class={background.contain ? "deck-contain" : undefined}
                    />
                {/each}
            </div>
        {/if}
        {#if look?.header}
            <div class="deck-header">{@html renderInline(look.header)}</div>
        {/if}
        <div class="deck-content">{@html rendered.html}</div>
        {#if look?.footer}
            <div class="deck-footer">{@html renderInline(look.footer)}</div>
        {/if}
        {#if look?.paginate}
            <span class="deck-page">{number}</span>
        {/if}
    </section>
</div>
