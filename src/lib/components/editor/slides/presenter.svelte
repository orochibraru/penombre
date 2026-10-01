<script lang="ts">
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		MonitorUpIcon,
		PauseIcon,
		PlayIcon,
		RotateCcwIcon,
		XIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import Button from "#lib/components/ui/button/button.svelte";
	import { clock, slideKey } from "#lib/deck/present.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { Deck } from "#lib/slides/model.js";
	import { randomId } from "#lib/utils.js";
	import type { RenderContext } from "./render-context.js";
	import {
		labelOf,
		readSlidesMessage,
		send,
		shownSlides,
		slidesChannel,
	} from "./shown.js";
	import SlideView from "./slide-view.svelte";

	/**
	 * The presenter's screen: this slide, the next, the notes and a clock.
	 * The audience window is another tab of this page, kept on the same
	 * slide over a BroadcastChannel, and it can navigate back through it.
	 */
	let {
		deck,
		index = $bindable(),
		media,
		onexit,
	}: {
		deck: Deck;
		index: number;
		media: RenderContext["media"];
		onexit: () => void;
	} = $props();

	const shown = $derived(shownSlides(deck));
	const position = $derived(Math.max(0, shown.indexOf(index)));
	const slide = $derived(deck.slides[shown[position] ?? 0]);
	const next = $derived(deck.slides[shown[position + 1] ?? -1]);
	let typed = "";
	let elapsed = $state(0);
	let running = $state(true);
	let mainWidth = $state(0);
	let nextWidth = $state(0);

	$effect(() => {
		if (!running) {
			return;
		}
		const timer = setInterval(() => elapsed++, 1000);
		return () => clearInterval(timer);
	});

	const id = randomId();
	let audience: Window | null = null;
	let port: BroadcastChannel | undefined;

	$effect(() => {
		const channel = slidesChannel(id);
		channel.onmessage = (event: MessageEvent) => {
			const message = readSlidesMessage(event.data);
			if (message?.type === "hello") {
				send(port, {
					type: "state",
					deck: JSON.stringify($state.snapshot(deck)),
					index,
				});
			} else if (message?.type === "go") {
				index = message.index;
			}
		};
		port = channel;
		return () => {
			channel.close();
			audience?.close();
		};
	});

	$effect(() => {
		send(port, {
			type: "state",
			deck: JSON.stringify($state.snapshot(deck)),
			index,
		});
	});

	function openAudience() {
		const url = new URL(window.location.href);
		url.searchParams.set("audience", id);
		audience = window.open(url, `penombre-audience-${id}`, "popup");
		if (!audience) {
			toast.error(m.deck_audience_blocked());
		}
	}

	function go(to: number) {
		index = shown[Math.min(Math.max(0, to), shown.length - 1)] ?? 0;
	}

	function onkey(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) {
			return;
		}
		const action = slideKey(event.key, position, shown.length, typed);
		if (action && "index" in action) {
			event.preventDefault();
			typed = action.typed;
			go(action.index);
		} else if (action && "exit" in action) {
			onexit();
		}
	}
</script>

<svelte:window onkeydown={onkey} />

<div class="bg-background fixed inset-0 z-100 flex flex-col gap-3 overflow-y-auto p-3 sm:p-4" role="region" aria-label={m.deck_presenter_view()}>
	<div class="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[2fr_1fr]">
		<div bind:clientWidth={mainWidth} class="min-w-0">
			{#if slide}
				<SlideView {deck} {slide} width={mainWidth} {media} label={labelOf} class="rounded-lg border" />
			{/if}
		</div>
		<div class="flex flex-col gap-3 lg:min-h-0">
			<div bind:clientWidth={nextWidth}>
				<p class="text-muted-foreground mb-1 text-xs">{m.deck_next_slide()}</p>
				{#if next}
					<SlideView {deck} slide={next} width={nextWidth} {media} label={labelOf} class="rounded-lg border" />
				{:else}
					<div class="text-muted-foreground grid aspect-video place-items-center rounded-lg border text-sm">{m.deck_end()}</div>
				{/if}
			</div>
			<div class="flex min-h-32 flex-1 flex-col lg:min-h-0">
				<p class="text-muted-foreground mb-1 text-xs">{m.deck_speaker_notes()}</p>
				<div class="flex-1 overflow-y-auto rounded-lg border p-3 text-base whitespace-pre-wrap">
					{#if slide?.notes}
						{slide.notes}
					{:else}
						<span class="text-muted-foreground">{m.deck_no_notes()}</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" size="icon" aria-label={m.previous()} onclick={() => go(position - 1)}>
			<ChevronLeftIcon />
		</Button>
		<span class="min-w-12 text-center text-sm tabular-nums">{position + 1} / {shown.length}</span>
		<Button variant="outline" size="icon" aria-label={m.next()} onclick={() => go(position + 1)}>
			<ChevronRightIcon />
		</Button>
		<div class="flex items-center gap-1 rounded-lg border px-2">
			<span class="font-mono text-sm tabular-nums">{clock(elapsed)}</span>
			<Button variant="ghost" size="icon" aria-label={running ? m.deck_timer_pause() : m.deck_timer_start()} onclick={() => (running = !running)}>
				{#if running}<PauseIcon />{:else}<PlayIcon />{/if}
			</Button>
			<Button variant="ghost" size="icon" aria-label={m.deck_timer_reset()} onclick={() => (elapsed = 0)}>
				<RotateCcwIcon />
			</Button>
		</div>
		<div class="ms-auto flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={openAudience}>
				<MonitorUpIcon class="size-4" />
				{m.deck_open_audience()}
			</Button>
			<Button variant="outline" size="icon" aria-label={m.close()} onclick={onexit}>
				<XIcon />
			</Button>
		</div>
	</div>
</div>
