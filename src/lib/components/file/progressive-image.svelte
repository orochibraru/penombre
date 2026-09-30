<script lang="ts">
	import { untrack } from "svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { cn, readableFileSize } from "#lib/utils.js";

	interface Props {
		/** The listing's thumbnail: already cached, so it paints at once. */
		thumb: string;
		/** A render large enough to look at, a fraction of a photo's bytes. */
		preview: string;
		original: string;
		alt: string;
		/** The original's bytes: one this small is simply loaded. */
		size?: number;
		class?: string;
	}

	let {
		thumb,
		preview,
		original,
		alt,
		size,
		class: className,
	}: Props = $props();

	/** Below this the preview saves nothing worth a second request. */
	const SMALL = 400 * 1024;
	/** A render is a still: these are shown as they are. */
	const asIs = $derived(/\.(gif|svg)$/i.test(alt));
	const direct = $derived(asIs || (size !== undefined && size < SMALL));

	let shown = $state("");
	let painted = $state(false);
	let upgrading = $state(false);
	const isOriginal = $derived(shown === original);

	$effect(() => {
		const first = direct ? original : preview;
		untrack(() => {
			shown = first;
			painted = false;
			upgrading = false;
		});
	});

	/** Loaded off screen, then swapped in: the preview stays up meanwhile. */
	function upgrade() {
		upgrading = true;
		const wanted = original;
		const image = new Image();
		const settle = () => {
			if (wanted === original) {
				shown = wanted;
				upgrading = false;
			}
		};
		image.onload = settle;
		image.onerror = settle;
		image.src = wanted;
	}
</script>

<div class={cn("relative min-h-0 min-w-0", className)}>
    {#if !painted}
        <img
            src={thumb}
            alt=""
            aria-hidden="true"
            class="absolute inset-0 size-full scale-105 object-contain blur-md"
            onerror={(event) => (event.currentTarget as HTMLImageElement).remove()}
        >
        <div class="absolute inset-0 flex items-center justify-center">
            <Spinner class="size-6" />
        </div>
    {/if}
    <img
        src={shown}
        alt={alt}
        class={cn(
            "relative size-full rounded-md object-scale-down transition-opacity",
            !painted && "opacity-0",
        )}
        onload={() => painted = true}
        onerror={() => {
            // No render for this type (HEIC, a broken file): the bytes themselves.
            if (shown !== original) {
                shown = original;
            } else {
                painted = true;
            }
        }}
    >
    {#if painted && !isOriginal}
        <Button
            variant="secondary"
            size="sm"
            class="absolute inset-e-2 bottom-2 shadow"
            disabled={upgrading}
            onclick={upgrade}
        >
            {#if upgrading}
                <Spinner />
            {/if}
            {m.image_show_original()}
            {#if size !== undefined}
                <span class="text-muted-foreground">{readableFileSize(size)}</span>
            {/if}
        </Button>
    {/if}
</div>
