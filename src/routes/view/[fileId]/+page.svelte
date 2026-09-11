<script lang="ts">
	import {
		ArrowLeftIcon,
		DownloadIcon,
		MessageSquareTextIcon,
		PauseIcon,
		PlayIcon,
		Volume1Icon,
		Volume2Icon,
		VolumeXIcon,
		XIcon,
	} from "@lucide/svelte";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import NotesPanel from "$lib/components/file/notes-panel.svelte";
	import Waveform from "$lib/components/file/waveform.svelte";
	import { Button } from "$lib/components/ui/button/index";
	import { Progress } from "$lib/components/ui/progress/index";
	import { Slider } from "$lib/components/ui/slider/index";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { cn, readableFileSize } from "$lib/utils";

	let { data } = $props();

	const base = $derived(
		`/api/v1/storage/file/${encodeURIComponent(data.path)}`,
	);
	const src = $derived(`${base}?raw=true`);
	const peaks = $derived(`${base}?thumbnail=true&size=large`);

	const isVideo = $derived(data.contentType.startsWith("video/"));
	const isAudio = $derived(data.contentType.startsWith("audio/"));
	const isImage = $derived(data.contentType.startsWith("image/"));

	// The root layout renders `<title>` from this store; setting one here too
	// would put two of them in the head.
	$effect(() => {
		title.set(data.name);
	});

	/**
	 * Opened in a new tab there is nothing to go back to, so the control
	 * becomes a link to the drive instead of a dead button.
	 */
	let canGoBack = $state(false);
	$effect(() => {
		canGoBack = history.length > 1;
	});

	let player = $state<HTMLMediaElement | null>(null);
	let paused = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let peaksFailed = $state(false);
	let notesOpen = $state(false);
	/** Set by the notes panel so clicking the waveform can hand it the caret. */
	let focusNotes = $state<(() => void) | undefined>();

	function formatTime(time: number): string {
		if (!Number.isFinite(time)) {
			return "00:00";
		}
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	}

	function toggle() {
		if (!player) {
			return;
		}
		if (player.paused) {
			void player.play();
		} else {
			player.pause();
		}
	}

	function seekTo(seconds: number) {
		currentTime = seconds;
	}

	/**
	 * Scrubbing the waveform also stops the track and puts the caret in the
	 * note box: the reason to click a moment is almost always to say something
	 * about it.
	 */
	function scrub(fraction: number) {
		if (Number.isFinite(duration)) {
			currentTime = fraction * duration;
		}
		player?.pause();
		notesOpen = true;
		focusNotes?.();
	}

	function seekFromBar(event: MouseEvent) {
		const { left, width } = (
			event.currentTarget as HTMLElement
		).getBoundingClientRect();
		if (width > 0 && Number.isFinite(duration)) {
			currentTime = ((event.clientX - left) / width) * duration;
		}
	}
</script>

<div class="bg-background flex h-svh w-full flex-col overflow-hidden">
    <header class="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        {#if canGoBack}
            <Button
                variant="ghost"
                size="icon"
                title={m.back()}
                onclick={() => history.back()}
            >
                <ArrowLeftIcon />
            </Button>
        {:else}
            <Button
                variant="ghost"
                size="icon"
                title={m.nav_my_drive()}
                href={resolve("/browse") as Pathname}
            >
                <ArrowLeftIcon />
            </Button>
        {/if}
        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{data.name}</p>
            <p class="text-muted-foreground truncate text-xs">
                {readableFileSize(data.size)}
            </p>
        </div>
        <Button variant="outline" size="icon" title={m.download()} href={src as Pathname} download={data.name}>
            <DownloadIcon />
        </Button>
        <Button
            variant={notesOpen ? "default" : "outline"}
            size="icon"
            title={m.notes_title()}
            onclick={() => (notesOpen = !notesOpen)}
        >
            <MessageSquareTextIcon />
        </Button>
    </header>

    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main
            class={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-4 p-4",
                // The notes panel takes the screen on a phone rather than
                // squeezing the media into a strip.
                notesOpen && "hidden lg:flex",
            )}
        >
            {#if isImage}
                <img
                    {src}
                    alt={data.name}
                    class="max-h-full max-w-full rounded-lg object-contain"
                />
            {:else if isVideo}
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                    bind:this={player}
                    bind:paused
                    bind:currentTime
                    bind:duration
                    bind:volume
                    {src}
                    playsinline
                    class="max-h-[calc(100%-4rem)] w-full rounded-lg bg-black object-contain"
                ></video>
            {:else if isAudio}
                <div class="flex w-full max-w-3xl flex-col items-center gap-6">
                    <audio
                        bind:this={player}
                        bind:paused
                        bind:currentTime
                        bind:duration
                        bind:volume
                        {src}
                        class="sr-only"
                    ></audio>
                    {#if !peaksFailed}
                        <Waveform
                            src={peaks}
                            class="h-40 w-full"
                            progress={duration > 0 ? currentTime / duration : 0}
                            onseek={scrub}
                            seekLabel={m.seek()}
                            onfail={() => (peaksFailed = true)}
                        />
                    {/if}
                </div>
            {:else}
                <embed {src} title={data.name} class="h-full w-full" />
            {/if}

            {#if isVideo || isAudio}
                <div class="flex w-full max-w-3xl shrink-0 items-center gap-3">
                    <Button size="icon" onclick={toggle} title={paused ? m.play() : m.pause()}>
                        {#if paused}
                            <PlayIcon />
                        {:else}
                            <PauseIcon />
                        {/if}
                    </Button>
                    <span class="text-xs tabular-nums text-nowrap">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    {#if isVideo}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div class="min-w-0 flex-1" onclick={seekFromBar}>
                            <Progress
                                value={currentTime}
                                max={duration || 1}
                                class="cursor-pointer"
                            />
                        </div>
                    {:else}
                        <div class="flex-1"></div>
                    {/if}
                    <div class="flex w-32 items-center gap-2">
                        {#if volume === 0}
                            <VolumeXIcon class="size-4 shrink-0" />
                        {:else if volume < 1}
                            <Volume1Icon class="size-4 shrink-0" />
                        {:else}
                            <Volume2Icon class="size-4 shrink-0" />
                        {/if}
                        <Slider
                            type="single"
                            bind:value={volume}
                            max={1}
                            step={0.01}
                        />
                    </div>
                </div>
            {/if}
        </main>

        {#if notesOpen}
            <aside
                class="flex min-h-0 w-full flex-col border-t p-4 lg:w-96 lg:shrink-0 lg:border-t-0 lg:border-s"
            >
                <div class="mb-2 flex items-center justify-end lg:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        title={m.close()}
                        onclick={() => (notesOpen = false)}
                    >
                        <XIcon />
                    </Button>
                </div>
                <NotesPanel
                    fileId={data.fileId}
                    position={isVideo || isAudio ? currentTime : undefined}
                    onSeek={isVideo || isAudio ? seekTo : undefined}
                    currentUserId={data.userId}
                    bind:focus={focusNotes}
                />
            </aside>
        {/if}
    </div>
</div>
