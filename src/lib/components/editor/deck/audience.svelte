<script lang="ts">
	import { untrack } from "svelte";
	import {
		type Deck,
		deckTheme,
		parseDeck,
		slideLooks,
	} from "#lib/deck/format.js";
	import { deckChannel, post, readMessage } from "#lib/deck/present.js";
	import { toggleFullscreen } from "#lib/utils.js";
	import Present from "./present.svelte";

	/**
	 * The window the presenter view opened: the slides and nothing else,
	 * following the presenter. It starts from the saved file and takes the
	 * presenter's copy, unsaved edits included, as soon as it answers.
	 */
	let { channel: id, initial }: { channel: string; initial: Deck } = $props();

	let deck = $state(untrack(() => initial));
	let index = $state(0);
	const looks = $derived(slideLooks(deck));
	const theme = $derived(deckTheme(deck));
	let root = $state<HTMLElement>();
	let port: BroadcastChannel | undefined;

	$effect(() => {
		const channel = deckChannel(id);
		channel.onmessage = (event: MessageEvent) => {
			const message = readMessage(event.data);
			if (message?.type === "state") {
				deck = parseDeck(message.markdown);
				index = message.index;
			}
		};
		post(channel, { type: "hello" });
		port = channel;
		return () => channel.close();
	});

	function navigate(to: number) {
		index = to;
		post(port, { type: "go", index: to });
	}
</script>

<div bind:this={root}>
    <Present
        {deck}
        {looks}
        {theme}
        {index}
        quiet
        onnavigate={navigate}
        onexit={() => window.close()}
        onfullscreen={() => toggleFullscreen(root ?? null)}
    />
</div>
