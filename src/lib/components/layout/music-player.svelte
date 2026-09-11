<script lang="ts">
	import {
		ExternalLinkIcon,
		PauseIcon,
		PlayIcon,
		Volume1Icon,
		Volume2Icon,
		VolumeXIcon,
	} from "@lucide/svelte";
	import { dev } from "$app/environment";
	import type { Pathname } from "$app/types";
	import Waveform from "$lib/components/file/waveform.svelte";
	import BottomAction from "$lib/components/layout/bottom-action.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Popover from "$lib/components/ui/popover/index";
	import { Progress } from "$lib/components/ui/progress/index";
	import { Slider } from "$lib/components/ui/slider/index";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import {
		playableMusic,
		playbackCommand,
		playbackDuration,
		playbackPosition,
	} from "$lib/store/music";

	function clearCurrent() {
		$playableMusic = null;
	}

	// biome-ignore lint/suspicious/noUnassignedVariables: assigned by bind:this in the markup
	let player: HTMLAudioElement;

	let paused = $state(!!dev);
	let currentTime = $state(0);

	// Mirrored into a store so the notes panel can stamp a note with wherever
	// the track currently is, without reaching into this component.
	$effect(() => {
		playbackPosition.set(currentTime);
	});
	let duration = $state(0);
	$effect(() => {
		playbackDuration.set(duration);
	});
	let volume = $state(1);
	let loading: boolean = $state(true);
	let seeking: boolean = $state(false);

	$effect(() => {
		const music = $playableMusic;

		// Make sure the player element has been created before we try to use it.
		if (player && music?.source) {
			// Only update the source if it's different from the current one.
			// This prevents unnecessary reloads if the effect is re-triggered.
			if (player.src !== music.source) {
				loading = true;
				player.src = music.source;
				// `load()` tells the audio element to fetch the new source.
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

	/**
	 * The waveform is the progress bar. It only exists once the peak data has
	 * loaded, so a plain bar stands in until then (and forever, for a file the
	 * server could not analyse).
	 */
	let peaksFailed = $state(false);

	$effect(() => {
		// Reset per track, or one file without peaks poisons the next.
		void $playableMusic?.source;
		peaksFailed = false;
	});

	const peaksUrl = $derived(peaksFailed ? "" : ($playableMusic?.peaks ?? ""));

	// Seek, pause and play requested from elsewhere — the notes panel drives
	// the playhead while the audio element lives here.
	$effect(() => {
		const command = $playbackCommand;
		if (!(command && player)) {
			return;
		}
		if (command.type === "seek" && command.seconds !== undefined) {
			currentTime = command.seconds;
			return;
		}
		if (command.type === "pause") {
			player.pause();
			if ($playableMusic) {
				$playableMusic.isPlaying = false;
			}
			return;
		}
		void player.play().catch(() => {
			paused = true;
		});
	});

	function seekToFraction(fraction: number) {
		if (!Number.isNaN(duration)) {
			currentTime = fraction * duration;
		}
	}

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
			seeking = true;
			// Svelte's two-way binding will update the audio element automatically
			currentTime = clickPosition * duration;
			// Re-enable transition after the DOM has updated
			requestAnimationFrame(() => {
				seeking = false;
			});
		}
	}

	// Publish this panel's height so other bottom drawers can stack above it.
	// Measured rather than hard-coded: the player grows when a long title
	// wraps, and a guessed constant would either overlap or leave a gap.
	let panel: HTMLElement | null = $state(null);

	$effect(() => {
		const root = document.documentElement;
		if (!panel) {
			root.style.removeProperty("--player-height");
			return;
		}
		const observer = new ResizeObserver(([entry]) => {
			root.style.setProperty(
				"--player-height",
				`${entry?.target.getBoundingClientRect().height ?? 0}px`,
			);
		});
		observer.observe(panel);
		return () => {
			observer.disconnect();
			root.style.removeProperty("--player-height");
		};
	});
</script>

<BottomAction
    bind:ref={panel}
    open={$playableMusic !== null}
    title={$playableMusic?.title ?? ""}
    callback={() => clearCurrent()}
>
    <div class="flex w-full items-center gap-2">
        <div class="flex items-center justify-between gap-2">
            {#if loading}
                <Button disabled>
                    <Spinner />
                </Button>
            {:else if paused}
                <Button
                    onclick={() => {
                        player?.play();
                        if ($playableMusic) {
                            $playableMusic.isPlaying = true;
                        }
                    }}
                    title={m.play()}
                >
                    <PlayIcon />
                </Button>
            {:else}
                <Button
                    onclick={() => {
                        player?.pause();
                        if ($playableMusic) {
                            $playableMusic.isPlaying = false;
                        }
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
        {#if peaksUrl}
            <Waveform
                src={peaksUrl}
                class="h-10 min-w-0 flex-1"
                progress={duration > 0 ? currentTime / duration : 0}
                onseek={seekToFraction}
                seekLabel={m.seek()}
                onfail={() => (peaksFailed = true)}
            />
        {:else}
            <Progress
                value={currentTime}
                max={duration}
                class="w-full cursor-pointer {seeking
                    ? '**:data-[slot=progress-indicator]:transition-none!'
                    : ''}"
                onclick={seek}
            />
        {/if}
        <!-- The viewer, not the raw file: a bare browser audio element has no
             notes and no title. Falls back to the file when the track came
             from somewhere with no id (a share link). -->
        <Button
            variant="outline"
            title={m.open_in_new_tab()}
            href={($playableMusic?.fileId
                ? `/view/${$playableMusic.fileId}`
                : $playableMusic?.source) as Pathname}
            target="_blank"
        >
            <ExternalLinkIcon />
        </Button>
        <Popover.Root>
            <Popover.Trigger title={m.change_volume()}>
                <Button variant="outline">
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

    <audio
        id="music-player"
        class="sr-only w-full rounded-none"
        title={$playableMusic?.title}
        playsinline
        onwaiting={() => {
            loading = true;
        }}
        onplaying={() => {
            loading = false;
        }}
        oncanplay={() => {
            loading = false;
            if (!dev) {
                player
                    .play()
                    .then(() => {
                        if ($playableMusic) {
                            $playableMusic.isPlaying = true;
                        }
                    })
                    .catch((error) => {
                        console.error("Autoplay was prevented:", error);
                        // If autoplay fails, update the UI to show the paused state.
                        paused = true;
                        if ($playableMusic) {
                            $playableMusic.isPlaying = false;
                        }
                    });
            }
        }}
        bind:this={player}
        bind:paused
        bind:currentTime
        bind:duration
        bind:volume
    ></audio>
</BottomAction>
