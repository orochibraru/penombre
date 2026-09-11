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
		progress,
		onseek,
		seekLabel,
	}: {
		src: string;
		class?: string;
		onfail?: () => void;
		onload?: () => void;
		/** Played fraction, 0–1. Fills the bars up to that point when given. */
		progress?: number;
		/** Turns the waveform into a scrubber; receives a 0–1 fraction. */
		onseek?: (fraction: number) => void;
		seekLabel?: string;
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

	const clipWidth = $derived(
		Math.max(0, Math.min(1, progress ?? 0)) * viewWidth,
	);

	/**
	 * Unique per instance: two waveforms on one page sharing a clipPath id
	 * means the second one's playhead drives the first.
	 */
	const clipId = `wave-${crypto.randomUUID()}`;

	function fractionFrom(event: MouseEvent): number {
		const { left, width } = (
			event.currentTarget as HTMLElement
		).getBoundingClientRect();
		if (width <= 0) {
			return 0;
		}
		return Math.max(0, Math.min(1, (event.clientX - left) / width));
	}
</script>

{#snippet waves(fill: string, clip?: string)}
    <g fill={fill} clip-path={clip}>
        {#each bars as bar, index (index)}
            <rect
                x={bar.x}
                y={(HEIGHT - bar.height) / 2}
                width="1"
                height={bar.height}
                rx="0.4"
            />
        {/each}
    </g>
{/snippet}

{#snippet svg()}
    <svg
        data-slot="waveform"
        class={cn("h-full w-full", onseek ? undefined : className)}
        viewBox="0 0 {viewWidth} {HEIGHT}"
        preserveAspectRatio="none"
        aria-hidden="true"
        fill="currentColor"
    >
        {#if progress === undefined}
            {@render waves("currentColor")}
        {:else}
            <defs>
                <clipPath id={clipId}>
                    <rect x="0" y="0" width={clipWidth} height={HEIGHT} />
                </clipPath>
            </defs>
            <!-- Unplayed behind, played on top and clipped to the playhead:
                 one pass of bars would need every rect duplicated per frame. -->
            {@render waves("var(--muted-foreground)")}
            {@render waves("var(--primary)", `url(#${clipId})`)}
        {/if}
    </svg>
{/snippet}

{#if bars.length > 0}
    {#if onseek}
        <button
            type="button"
            class={cn("block w-full cursor-pointer", className)}
            aria-label={seekLabel}
            onclick={(event) => onseek(fractionFrom(event))}
        >
            {@render svg()}
        </button>
    {:else}
        {@render svg()}
    {/if}
{/if}
