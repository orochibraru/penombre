<script lang="ts">
	import { cn } from "$lib/utils";

	/**
	 * An audio waveform drawn from peak data.
	 *
	 * Inline SVG rather than an `<img>`: an image is isolated from the page's
	 * CSS, so it could never follow the accent. Drawn here, the bars are
	 * `currentColor` and re-colour the moment the theme changes — which is the
	 * whole reason the server returns numbers instead of a picture.
	 */
	let {
		src,
		class: className,
		onfail,
		onload,
	}: {
		src: string;
		class?: string;
		onfail?: () => void;
		onload?: () => void;
	} = $props();

	let peaks = $state<number[]>([]);

	$effect(() => {
		const url = src;
		if (!url) {
			return;
		}
		const controller = new AbortController();

		void (async () => {
			try {
				const res = await fetch(url, { signal: controller.signal });
				if (!res.ok) {
					throw new Error(String(res.status));
				}
				const data = (await res.json()) as unknown;
				if (Array.isArray(data) && data.length > 0) {
					peaks = data as number[];
					onload?.();
				} else {
					onfail?.();
				}
			} catch (error) {
				// An aborted fetch is this component being replaced, not a
				// failure worth falling back for.
				if ((error as Error).name !== "AbortError") {
					onfail?.();
				}
			}
		})();

		return () => controller.abort();
	});

	/** Viewbox units. The SVG scales to its box, so these are arbitrary. */
	const HEIGHT = 100;
	const GAP = 0.25;

	const bars = $derived.by(() => {
		if (peaks.length === 0) {
			return [];
		}
		const width = 1;
		return peaks.map((peak, index) => ({
			x: index * (width + GAP),
			// A floor so silence is still a visible line rather than a gap.
			height: Math.max(1.5, peak * HEIGHT),
		}));
	});

	const viewWidth = $derived(Math.max(1, peaks.length * (1 + GAP)));
</script>

{#if bars.length > 0}
    <svg
        data-slot="waveform"
        class={cn("h-full w-full", className)}
        viewBox="0 0 {viewWidth} {HEIGHT}"
        preserveAspectRatio="none"
        aria-hidden="true"
        fill="currentColor"
    >
        {#each bars as bar, index (index)}
            <rect
                x={bar.x}
                y={(HEIGHT - bar.height) / 2}
                width="1"
                height={bar.height}
                rx="0.4"
            />
        {/each}
    </svg>
{/if}
