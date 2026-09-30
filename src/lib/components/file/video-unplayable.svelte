<script lang="ts">
	import {
		DownloadIcon,
		FileVideoCameraIcon,
		WandSparklesIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import type { VideoSource } from "#lib/video-source.svelte.js";
	import type { ResolvedPathname } from "$app/types";

	interface Props {
		source: VideoSource;
		/** The original's bytes, for the download. */
		href: string;
		name: string;
	}

	let { source, href, name }: Props = $props();

	async function convert() {
		const done = await source.choose(720);
		if (done.status === "failed") {
			toast.error(m.video_convert_failed());
		}
	}
</script>

<!-- In place of the player: a dead video element with live controls under it
     says nothing about why, or what to do. -->
<div
    class="bg-muted/40 flex w-full flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center"
>
    {#if source.preparing}
        <Spinner class="size-8" />
        <p class="font-medium">{m.video_converting()}</p>
        <p class="text-muted-foreground max-w-prose text-sm">{m.video_converting_hint()}</p>
        <Button variant="outline" size="sm" onclick={() => void source.choose("original")}>
            {m.cancel()}
        </Button>
    {:else}
        <FileVideoCameraIcon class="text-muted-foreground size-10" />
        <p class="font-medium">{m.video_unplayable_title()}</p>
        <p class="text-muted-foreground max-w-prose text-sm">
            {source.convertible ? m.video_unplayable_hint() : m.video_unplayable_download()}
        </p>
        <div class="flex flex-wrap justify-center gap-2">
            {#if source.convertible}
                <Button onclick={() => void convert()}>
                    <WandSparklesIcon />
                    {m.video_convert()}
                </Button>
            {/if}
            <Button variant="outline" href={href as ResolvedPathname} download={name}>
                <DownloadIcon />
                {m.download()}
            </Button>
        </div>
    {/if}
</div>
