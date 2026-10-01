<script lang="ts">
	import { untrack } from "svelte";
	import type { Deck } from "#lib/slides/model.js";
	import { toggleFullscreen } from "#lib/utils.js";
	import Present from "./present.svelte";
	import type { RenderContext } from "./render-context.js";
	import { readSlidesMessage, send, slidesChannel } from "./shown.js";

	/**
	 * The window the presenter view opened: the slides and nothing else,
	 * following the presenter. It starts from the saved deck and takes the
	 * presenter's copy, unsaved edits included, as soon as it answers.
	 */
	let {
		channel: id,
		initial,
		media,
	}: {
		channel: string;
		initial: Deck;
		media: RenderContext["media"];
	} = $props();

	let deck = $state(untrack(() => initial));
	let index = $state(0);
	let root = $state<HTMLElement>();
	let port: BroadcastChannel | undefined;

	$effect(() => {
		const channel = slidesChannel(id);
		channel.onmessage = (event: MessageEvent) => {
			const message = readSlidesMessage(event.data);
			if (message?.type === "state") {
				deck = JSON.parse(message.deck) as Deck;
				index = message.index;
			}
		};
		send(channel, { type: "hello" });
		port = channel;
		return () => channel.close();
	});

	function navigate(to: number) {
		index = to;
		send(port, { type: "go", index: to });
	}
</script>

<div bind:this={root}>
	<Present {deck} {index} {media} quiet onnavigate={navigate} onexit={() => window.close()} onfullscreen={() => toggleFullscreen(root ?? null)} />
</div>
