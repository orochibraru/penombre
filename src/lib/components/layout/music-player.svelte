<script lang="ts">
	import {
		PauseIcon,
		PlayIcon,
		Volume1Icon,
		Volume2Icon,
		VolumeXIcon,
		XIcon
	} from '@lucide/svelte';
	import { fade, slide } from 'svelte/transition';
	import { dev } from '$app/environment';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { playableMusic } from '$lib/store/music';

	function clearCurrent() {
		$playableMusic = null;
	}

	let player: HTMLAudioElement | undefined = $state(undefined);

	let paused = $state(!!dev);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);

	const formatTime = (time: number) => {
		if (Number.isNaN(time)) return '00:00';
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	};

	function seek(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		}
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

{#if $playableMusic}
	<div
		class="music-player lg:music-player-lg bg-sidebar/50 fixed right-5 bottom-5 rounded-xl border p-3 backdrop-blur-sm"
		transition:slide
	>
		<div class="mb-2 flex items-center justify-between">
			<p class="font-medium">{$playableMusic.title}</p>
			<Button variant="ghost" title="Close" onclick={() => clearCurrent()}>
				<XIcon />
			</Button>
		</div>

		<div class="flex items-center gap-2">
			<div class="flex items-center justify-between gap-2">
				{#if paused}
					<Button onclick={() => player?.play()} title="Play">
						<PlayIcon />
					</Button>
				{:else}
					<Button onclick={() => player?.pause()} title="Pause">
						<PauseIcon />
					</Button>
				{/if}
				<p class="text-xs text-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</p>
			</div>
			<Progress value={currentTime} max={duration} class="w-full cursor-pointer" onclick={seek} />
			<Popover.Root>
				<Popover.Trigger title="Change Volume">
					<Button variant="outline">
						{#if volume === 1}
							<Volume2Icon />
						{:else if volume > 0 && volume < 1}
							<Volume1Icon />
						{:else if volume === 0}
							<VolumeXIcon />
						{/if}
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-10">
					<Slider type="single" orientation="vertical" bind:value={volume} max={1} step={0.01} />
				</Popover.Content>
			</Popover.Root>
		</div>

		<audio
			class="sr-only w-full rounded-none"
			bind:this={player}
			id="music-player"
			bind:paused
			bind:currentTime
			bind:duration
			bind:volume
			title={$playableMusic.title}
			src={$playableMusic.source}
			playsinline
			autoplay={!dev}
			crossorigin="anonymous"
		></audio>
	</div>
{/if}
