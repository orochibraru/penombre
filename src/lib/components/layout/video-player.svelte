<script lang="ts">
	import {
		ExpandIcon,
		MaximizeIcon,
		MinimizeIcon,
		PauseIcon,
		PlayIcon,
		Volume1Icon,
		Volume2Icon,
		VolumeXIcon,
	} from "@lucide/svelte";
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { withResume } from "#lib/components/file/file-links.js";
	import VideoQuality from "#lib/components/file/video-quality.svelte";
	import VideoUnplayable from "#lib/components/file/video-unplayable.svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Popover from "#lib/components/ui/popover/index.js";
	import { Progress } from "#lib/components/ui/progress/index.js";
	import { Slider } from "#lib/components/ui/slider/index.js";
	import Spinner from "#lib/components/ui/spinner.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import { playMedia } from "#lib/play.js";
	import { cn, toggleFullscreen } from "#lib/utils.js";
	import { VideoSource } from "#lib/video-source.svelte.js";
	import { dev } from "$app/env";
	import type { ResolvedPathname } from "$app/types";

	interface Props {
		src: string;
		title: string;
		/** Where the full-screen button goes; defaults to the raw file. */
		fullscreenHref?: string;
		/** Exposed so a notes panel can stamp and seek to a moment. */
		currentTime?: number;
		/** Where to open, when playback is coming back from the viewer. */
		startAt?: number;
	}

	let {
		src,
		title,
		fullscreenHref,
		startAt,
		currentTime = $bindable(0),
	}: Props = $props();

	const source = new VideoSource(() => src);
	/** The original will not play: the panel stands in for the player. */
	const blocked = $derived(source.quality === "original" && source.unplayable);

	// Another file starts from its own original.
	$effect(() => {
		void src;
		untrack(() => source.reset());
	});

	/** A change of quality is the same moment of the same video. */
	let resumeAt: number | undefined;
	let resumePlaying = false;
	function keepPlayhead() {
		resumeAt = currentTime;
		resumePlaying = !paused;
	}

	/** `loadedmetadata` is the first point a seek sticks, and only once. */
	let resumed = false;
	function resume() {
		if (resumeAt !== undefined) {
			currentTime = resumeAt;
			resumeAt = undefined;
			if (resumePlaying) {
				void playMedia(player);
			}
			return;
		}
		if (resumed || !startAt) {
			return;
		}
		resumed = true;
		currentTime = startAt;
	}

	let player: HTMLVideoElement;
	let shell = $state<HTMLDivElement | null>(null);
	let isFullscreen = $state(false);

	let paused = $state(!!dev);
	let duration = $state(0);
	let volume = $state(1);
	let loading: boolean = $state(true);
	let autoplayed = false;

	/** Only the viewer understands a playhead; the raw file is just bytes. */
	const viewerHref = $derived(
		fullscreenHref
			? withResume(fullscreenHref, { at: currentTime, playing: !paused })
			: src,
	);

	$effect(() => {
		// Make sure the player element has been created before we try to use it.
		const next = source.src;
		if (player && next) {
			// `player.src` is always resolved: compared raw, a relative source
			// never matched and every re-run reloaded it under a pending play.
			if (player.src !== new URL(next, window.location.href).href) {
				player.src = next;
				autoplayed = false;
				loading = true;
				player.load();
			}
		} else if (player) {
			// If there's no music, pause the player and clear the source.
			player.pause();
			player.src = "";

			// Reset the state for the UI
			currentTime = 0;
			duration = 0;
			paused = true;
		}
	});

	const formatTime = (time: number) => {
		if (Number.isNaN(time)) {
			return "00:00";
		}
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	function seek(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		},
	) {
		// Get the progress bar's dimensions and position
		const { left, width } = e.currentTarget.getBoundingClientRect();

		// Get the horizontal click position relative to the viewport
		const clickX = e.clientX;

		// Calculate the click position as a fraction of the total width
		const clickPosition = (clickX - left) / width;

		// If the duration is a valid number, calculate and set the new time
		if (!Number.isNaN(duration)) {
			// Svelte's two-way binding will update the audio element automatically
			currentTime = clickPosition * duration;
		}
	}
</script>

<svelte:document
	onfullscreenchange={() => isFullscreen = !!document.fullscreenElement}
></svelte:document>

<div bind:this={shell} class="flex flex-col w-full h-full bg-background">
	{#if blocked}
		<VideoUnplayable {source} href={src} name={title} />
	{/if}
	<video
		id="music-player"
		class={cn(
			// Capped so the controls under it stay inside the dialog's box: a
			// 16:9 video at full width was taller than the box and hid them.
			"mb-2 max-h-[calc(62vh-3.5rem)] w-full rounded-xl bg-black object-contain",
			blocked && "hidden",
		)}
		title={title}
		playsinline
		onloadedmetadata={resume}
		oncanplay={() => {
			loading = false;
			// Once: `canplay` fires again after every seek and stall.
			if (!dev && !autoplayed) {
				autoplayed = true;
				void playMedia(player);
			}
		}}
		onerror={() => {
			// No source is not a failure: the effect clears it on the way out.
			if (!player.getAttribute("src")) {
				return;
			}
			loading = false;
			const refused =
				player.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
				player.error?.code === MediaError.MEDIA_ERR_DECODE;
			if (refused && source.quality === "original") {
				source.unplayable = true;
				return;
			}
			toast.error(m.player_unplayable());
			if (source.quality !== "original") {
				void source.choose("original");
			}
		}}
		bind:this={player}
		bind:paused
		bind:currentTime
		bind:duration
		bind:volume
    >
        <track kind="captions" />
    </video>

	<div class={cn("flex w-full items-center gap-2", blocked && "hidden")}>
		<div class="flex items-center justify-between gap-2">
			{#if loading}
                <Button disabled title={m.loading()}>
                    <Spinner />
                </Button>
			{:else if paused}
                <Button
                    onclick={() => void playMedia(player)}
                    title={m.play()}
                >
                    <PlayIcon />
                </Button>
			{:else}
				<Button
					onclick={() => {
						player?.pause();
					}}
					title={m.pause()}
                >
                    <PauseIcon />
                </Button>
			{/if}
            <p class="text-xs text-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
            </p>
		</div>
		<Progress
			value={currentTime}
			max={duration}
			class="w-full cursor-pointer"
			onclick={seek}
		/>
		<Button
			variant="outline"
			title={isFullscreen ? m.exit_fullscreen() : m.fullscreen()}
			onclick={() => toggleFullscreen(shell, player)}
		>
			{#if isFullscreen}
				<MinimizeIcon />
			{:else}
				<ExpandIcon />
			{/if}
		</Button>
		<Button
			variant="outline"
			title={m.open_fullscreen()}
			href={viewerHref as ResolvedPathname}
		><MaximizeIcon /></Button>

		<VideoQuality {source} onswitch={keepPlayhead} />

		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" {...props} title={m.change_volume()}>
						{#if volume === 1}
							<Volume2Icon />
						{:else if volume > 0 && volume < 1}
							<Volume1Icon />
						{:else if volume === 0}
							<VolumeXIcon />
						{:else}
							<VolumeXIcon />
						{/if}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-10">
				<Slider
					type="single"
					orientation="vertical"
					bind:value={volume}
					max={1}
					step={0.01}
				/>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
