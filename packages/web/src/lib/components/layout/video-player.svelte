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
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Popover from "$lib/components/ui/popover/index";
    import { Progress } from "$lib/components/ui/progress/index";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import { Slider } from "$lib/components/ui/slider/index";

    type Props = {
        src: string;
        title: string;
    };

    let { src, title }: Props = $props();

    let player: HTMLAudioElement;

    let paused = $state(!!dev);
    let currentTime = $state(0);
    let duration = $state(0);
    let volume = $state(1);
    let loading: boolean = $state(true);

    $effect(() => {
        // Make sure the player element has been created before we try to use it.
        if (player && src) {
            // Only update the source if it's different from the current one.
            // This prevents unnecessary reloads if the effect is re-triggered.
            if (player.src !== src) {
                player.src = src;
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

    const formatTime = (time: number) => {
        if (Number.isNaN(time)) return "00:00";
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

<div class="flex flex-col w-full h-full">
    <video
        id="music-player"
        class="w-full rounded-xl mb-2"
        {title}
        playsinline
        oncanplay={() => {
            loading = false;
            if (!dev) {
                player.play().catch((error) => {
                    console.error("Autoplay was prevented:", error);
                    // If autoplay fails, update the UI to show the paused state.
                    paused = true;
                });
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
                    }}
                    title="Play"
                >
                    <PlayIcon />
                </Button>
            {:else}
                <Button
                    onclick={() => {
                        player?.pause();
                    }}
                    title="Pause"
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
            title="Open in new tab"
            href={src}
            target="_blank"
        >
            <ExternalLinkIcon />
        </Button>
        <Popover.Root>
            <Popover.Trigger title="Change Volume">
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
</div>
