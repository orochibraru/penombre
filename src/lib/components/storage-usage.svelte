<script lang="ts">
	import { m } from "$lib/paraglide/messages.js";
	import { readableFileSize } from "$lib/utils";

	interface Props {
		used: number;
		total: number;
		available: number;
		/** Label for the `used` segment. Defaults to "You". */
		usedLabel?: string;
		/** Hide the legend when the bar sits next to its own numbers. */
		compact?: boolean;
	}

	const {
		used,
		total,
		available,
		usedLabel,
		compact = false,
	}: Props = $props();

	// `used` is what this app's metadata accounts for; the rest of a shared
	// volume is other people's data, so the bar shows both against `total`.
	const otherUsed = $derived(Math.max(0, total - available - used));
	const pct = (value: number) =>
		total > 0 ? Math.min(100, (value / total) * 100) : 0;
	const usedPct = $derived(pct(used));

	const segments = $derived([
		{
			key: "used",
			label: usedLabel ?? m.storage_legend_you(),
			bytes: used,
			width: usedPct,
			bar: "bg-primary",
			dot: "bg-primary",
		},
		{
			key: "other",
			label: m.storage_legend_other(),
			bytes: otherUsed,
			width: pct(otherUsed),
			bar: "bg-primary/25",
			dot: "bg-primary/25",
		},
		{
			key: "free",
			label: m.storage_legend_free(),
			bytes: available,
			width: pct(available),
			bar: "",
			dot: "bg-muted-foreground/20",
		},
	]);
</script>

<div class="flex flex-col gap-3">
    <div class="flex items-end justify-between gap-3">
        <p class="text-2xl font-semibold tracking-tight tabular-nums">
            {readableFileSize(used)}
            <span class="text-muted-foreground text-sm font-normal">
                / {readableFileSize(total)}
            </span>
        </p>
        {#if total > 0}
            <p class="text-muted-foreground text-xs tabular-nums">
                {usedPct < 0.1 && used > 0 ? "<0.1" : usedPct.toFixed(1)}%
            </p>
        {/if}
    </div>

    <div
        class="bg-muted flex h-2.5 w-full overflow-hidden rounded-xs"
        role="img"
        aria-label={m.storage_used_of({
            used: readableFileSize(used),
            total: readableFileSize(total),
        })}
    >
        {#each segments as segment (segment.key)}
            {#if segment.bar}
                <div
                    class="{segment.bar} h-full transition-[width] duration-500 ease-out"
                    style="width: {segment.width}%"
                ></div>
            {/if}
        {/each}
    </div>

    {#if !compact}
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
            {#each segments as segment (segment.key)}
                <div class="flex items-center gap-1.5">
                    <span class="{segment.dot} size-2 rounded-xs"></span>
                    <span class="text-muted-foreground text-xs">
                        {segment.label}
                    </span>
                    <span class="text-xs font-medium tabular-nums">
                        {readableFileSize(segment.bytes)}
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>
