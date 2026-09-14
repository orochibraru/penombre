<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip/index";
	import type { NoteMarker } from "$lib/store/notes";
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
		markers = [],
		onmarker,
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
		/** Timestamped notes, shown as dots along the track. */
		markers?: NoteMarker[];
		onmarker?: (marker: NoteMarker) => void;
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
	 *
	 * `$props.id()`, not `crypto.randomUUID()`: that one is secure-context
	 * only, so on a self-hosted instance reached over plain HTTP at a LAN
	 * address it is `undefined` and this component threw on init — no
	 * waveform anywhere in the app.
	 */
	const uid = $props.id();
	const clipId = `wave-${uid}`;

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
        class="h-full w-full"
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
    <div class={cn("relative", className)}>
        {#if onseek}
            <button
                type="button"
                class="block h-full w-full cursor-pointer"
                aria-label={seekLabel}
                onclick={(event) => onseek(fractionFrom(event))}
            >
                {@render svg()}
            </button>
        {:else}
            {@render svg()}
        {/if}

        <!-- Notes live on the track itself, not only in the thread: a dot per
             timestamped note, its text on hover, a seek on click. The tooltip
             is portalled because the bottom player scrolls its own content and
             would otherwise clip it. -->
        {#if markers.length > 0}
            <Tooltip.Provider delayDuration={120}>
                {#each markers as marker (marker.id)}
                    <Tooltip.Root>
                        <Tooltip.Trigger
                            data-slot="waveform-marker"
                            class="absolute top-0 z-10 -translate-x-1/2 cursor-pointer p-0.5"
                            style="left: {marker.at * 100}%"
                            aria-label={marker.caption}
                            onclick={() => onmarker?.(marker)}
                        >
                            <span
                                class="bg-primary ring-background block size-2 rounded-full ring-2"
                            ></span>
                        </Tooltip.Trigger>
                        <Tooltip.Content
                            sideOffset={6}
                            class="max-w-56 border text-start"
                        >
                            <p class="font-mono text-[0.65rem] opacity-80">
                                {marker.caption}
                            </p>
                            <p class="wrap-break-word whitespace-pre-wrap">
                                {marker.body}
                            </p>
                        </Tooltip.Content>
                    </Tooltip.Root>
                {/each}
            </Tooltip.Provider>
        {/if}
    </div>
{/if}
