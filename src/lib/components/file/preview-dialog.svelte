<script lang="ts">
	import { MaximizeIcon, MessageSquareTextIcon } from "@lucide/svelte";
	import { untrack } from "svelte";
	import type { Pathname } from "$app/types";
	import NotesPanel from "$lib/components/file/notes-panel.svelte";
	import Waveform from "$lib/components/file/waveform.svelte";
	import VideoPlayer from "$lib/components/layout/video-player.svelte";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import { Badge } from "$lib/components/ui/badge/index";
	import { Button } from "$lib/components/ui/button/index";
	import * as Code from "$lib/components/ui/code/index";
	import * as m from "$lib/paraglide/messages.js";
	import {
		commandPlayback,
		playableMusic,
		playbackDuration,
		playbackPosition,
	} from "$lib/store/music";
	import { cn, readableFileSize } from "$lib/utils";
	import { fullscreenUrl } from "./file-links";
	import type { FileToView } from "./wrapper.svelte.js";

	/**
	 * The in-place preview: the file on the left, its notes thread on the
	 * right. `type: "notes"` is the audio case — the track plays in the global
	 * player, so there is nothing to show beside the thread but a scrubber.
	 */
	let {
		open = $bindable(false),
		fileToView,
		currentUserId,
	}: {
		open: boolean;
		fileToView: FileToView;
		currentUserId?: string;
	} = $props();

	/**
	 * The thread is opt-in: it only starts open when the dialog was opened
	 * from the "Notes" action, which is the `notes` type.
	 */
	let notesOpen = $state(false);
	let shownKey = $state("");
	const notesOnly = $derived(fileToView?.type === "notes");
	const viewKey = $derived(
		fileToView ? `${fileToView.item.key}:${fileToView.type}` : "",
	);
	$effect(() => {
		// Only on a change of file, or reopening the thread would be undone by
		// the effect the moment anything else here re-ran.
		if (viewKey !== untrack(() => shownKey)) {
			shownKey = viewKey;
			notesOpen = untrack(() => notesOnly);
		}
	});

	/** Playhead of the in-dialog video, shared with the notes panel. */
	let viewerTime: number = $state(0);
	/** Hands the caret to the note box when a moment is clicked. */
	let focusNotes: (() => void) | undefined = $state();

	function stampTime(seconds: number): string {
		const total = Math.max(0, Math.floor(seconds || 0));
		return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
			total % 60,
		).padStart(2, "0")}`;
	}
</script>

<ResponsiveDialog
    bind:open
    title={fileToView
        ? (fileToView.item.metadata.name ?? fileToView.item.key)
        : m.file_preview()}
    size="lg"
    bodyClass="max-h-[68svh] md:max-h-[72vh]"
>
    {#if fileToView}
        <div class="mb-5 flex flex-col justify-between gap-5 lg:flex-row">
            <span>
                {readableFileSize(fileToView.item.size as number) ?? "-"}
            </span>
            {#if fileToView.language}
                <Badge variant="outline" class="text-xs">
                    {fileToView.language}
                </Badge>
            {/if}
            <div class="flex items-center gap-2 pr-5">
                {#if fileToView.item.metadata.id && !notesOnly}
                    <Button
                        type="button"
                        variant={notesOpen ? "default" : "outline"}
                        size="sm"
                        title={m.notes_title()}
                        onclick={() => (notesOpen = !notesOpen)}
                    >
                        <MessageSquareTextIcon />
                        {m.notes_title()}
                    </Button>
                {/if}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    href={fullscreenUrl(fileToView.item) as Pathname}
                >
                    {m.open_fullscreen()}
                    <MaximizeIcon />
                </Button>
            </div>
        </div>
        <!-- Preview and notes sit side by side on a wide screen and stack
             below it, so the thread never squeezes the file it is about. -->
        <div class="flex min-h-0 w-full flex-col gap-4 lg:flex-row">
            <!-- A bounded box, not a scroller: the image is sized to fit what
                 is left of the viewport once the dialog's own chrome is
                 accounted for, so a tall photo shrinks instead of pushing the
                 dialog into a scroll. Code keeps its own scrolling. -->
            <div
                class={cn(
                    "flex max-h-[62vh] w-full min-w-0 flex-1 items-center justify-center overflow-auto",
                    fileToView.type === "notes" && "hidden",
                )}
            >
                {#if fileToView.type === "image"}
                    <img
                        src={fileToView.src}
                        alt={fileToView.item.metadata.name ?? fileToView.item.key}
                        class="max-h-[62vh] max-w-full rounded-md object-contain"
                    />
                {:else if fileToView.type === "video"}
                    <VideoPlayer
                        src={fileToView.src}
                        fullscreenHref={fullscreenUrl(fileToView.item)}
                        startAt={fileToView.startAt}
                        title={fileToView.item.metadata.name ??
                            fileToView.item.key}
                        bind:currentTime={viewerTime}
                    />
                {:else if fileToView.type === "code" && fileToView.language && fileToView.content}
                    <Code.Root
                        lang={fileToView.language}
                        class="h-full w-full min-w-0"
                        code={fileToView.content}
                    >
                        <Code.CopyButton />
                    </Code.Root>
                {:else if fileToView.type === "pdf"}
                    <embed
                        src={fileToView.src}
                        title={fileToView.item.metadata.name ?? fileToView.item.key}
                        class="h-[62vh] w-full"
                    />
                {/if}
            </div>

            {#if fileToView.item.metadata.id && (notesOnly || notesOpen)}
                {@const playingThis =
                    $playableMusic?.fileId === fileToView.item.metadata.id}
                <aside
                    class={cn(
                        "flex max-h-[62vh] min-h-80 w-full min-w-0 flex-col gap-3",
                        notesOnly
                            ? "flex-1"
                            : "lg:w-80 lg:shrink-0 lg:border-s lg:ps-4",
                    )}
                >
                    {#if fileToView.type === "notes" && playingThis && $playableMusic?.peaks}
                        <!-- The thread is about moments in the track, so the
                             track has to be in front of you. Clicking a moment
                             stops playback and hands the caret to the box: the
                             reason to click one is to write about it. -->
                        <div class="flex items-center gap-2">
                            <span
                                class="text-muted-foreground shrink-0 font-mono text-xs tabular-nums"
                            >
                                {stampTime($playbackPosition)} / {stampTime(
                                    $playbackDuration,
                                )}
                            </span>
                            <Waveform
                                src={$playableMusic.peaks}
                                class="h-14 min-w-0 flex-1"
                                progress={$playbackDuration > 0
                                    ? $playbackPosition / $playbackDuration
                                    : 0}
                                seekLabel={m.seek()}
                                onseek={(fraction) => {
                                    // One command, not two: a second call in
                                    // the same tick replaces the first before
                                    // the player ever sees it.
                                    commandPlayback({
                                        seek: fraction * $playbackDuration,
                                        pause: true,
                                    });
                                    focusNotes?.();
                                }}
                            />
                        </div>
                    {/if}
                    <NotesPanel
                        fileId={fileToView.item.metadata.id}
                        position={fileToView.type === "video"
                            ? viewerTime
                            : playingThis
                              ? $playbackPosition
                              : undefined}
                        onSeek={fileToView.type === "video"
                            ? (seconds) => (viewerTime = seconds)
                            : playingThis
                              ? (seconds) => commandPlayback({ seek: seconds })
                              : undefined}
                        {currentUserId}
                        bind:focus={focusNotes}
                    />
                </aside>
            {/if}
        </div>
    {/if}
</ResponsiveDialog>
