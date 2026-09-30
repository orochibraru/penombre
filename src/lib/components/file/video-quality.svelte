<script lang="ts">
	import { CheckIcon, Settings2Icon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { type Quality, RENDITION_HEIGHTS } from "#lib/renditions.js";
	import type { VideoSource } from "#lib/video-source.svelte.js";

	interface Props {
		source: VideoSource;
		/** Runs right before the source changes: note the playhead here. */
		onswitch?: () => void;
	}

	let { source, onswitch }: Props = $props();

	const label = (quality: Quality) =>
		quality === "original" ? m.video_quality_original() : `${quality}p`;

	async function pick(quality: Quality) {
		const done = await source.choose(quality, onswitch);
		if (done.status === "failed") {
			toast.error(m.video_convert_failed());
		} else if (done.status === "unavailable") {
			toast.info(m.video_quality_unavailable());
		}
	}
</script>

{#if source.convertible}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            {#snippet child({ props })}
                <Button variant="outline" {...props} title={m.video_quality()}>
                    {#if source.preparing}
                        <Spinner />
                        <span class="text-xs">{m.video_quality_preparing({ quality: label(source.preparing) })}</span>
                    {:else}
                        <Settings2Icon />
                        <span class="text-xs">{label(source.quality)}</span>
                    {/if}
                </Button>
            {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
            {#each ["original", ...RENDITION_HEIGHTS] as const as quality (quality)}
                <!-- The original is not offered for a format that cannot play. -->
                {#if !(quality === "original" && source.unplayable)}
                    <DropdownMenu.Item onclick={() => void pick(quality)}>
                        <CheckIcon class={source.quality === quality ? "" : "invisible"} />
                        {label(quality)}
                    </DropdownMenu.Item>
                {/if}
            {/each}
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{/if}
