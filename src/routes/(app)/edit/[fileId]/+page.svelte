<script lang="ts">
	import { CheckIcon, LoaderIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { browser } from "$app/environment";
	import { beforeNavigate } from "$app/navigation";
	import DeckEditor from "$lib/components/editor/deck-editor.svelte";
	import DocumentEditor from "$lib/components/editor/document-editor.svelte";
	import SheetEditor from "$lib/components/editor/sheet-editor.svelte";
	import { kindForName, saveDocument } from "$lib/documents";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	const { data } = $props();

	onMount(() => {
		title.set(data.name);
	});

	const kind = $derived(kindForName(data.name));

	let pending = $state<string | null>(null);
	let saving = $state(false);
	let savedAt = $state<Date | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Autosave, debounced.
	 *
	 * A document editor that needs a save button loses work; a save on every
	 * keystroke re-uploads the file dozens of times a minute. Two seconds of
	 * quiet is the compromise, plus a flush on the way out.
	 */
	function queue(content: string) {
		pending = content;
		clearTimeout(timer);
		timer = setTimeout(() => void flush(), 2000);
	}

	async function flush() {
		if (pending === null || saving) {
			return;
		}
		const content = pending;
		pending = null;
		saving = true;
		const ok = await saveDocument(
			data.fileId,
			data.name,
			data.contentType,
			content,
		);
		saving = false;
		if (ok) {
			savedAt = new Date();
		} else {
			// Put it back so the next tick retries rather than losing the edit.
			pending = content;
			toast.error(m.editor_save_error());
		}
	}

	beforeNavigate(() => {
		clearTimeout(timer);
		void flush();
	});
</script>

<svelte:window
    onbeforeunload={(event) => {
        if (pending !== null) {
            // Unsaved text is about to be dropped; let the browser ask.
            event.preventDefault();
        }
    }}
/>

<div class="flex h-[calc(100vh-8rem)] w-full flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="truncate text-lg font-medium">{data.name}</h1>
        <span
            class="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums"
        >
            {#if saving}
                <LoaderIcon class="size-3.5 animate-spin" />
                {m.editor_saving()}
            {:else if savedAt}
                <CheckIcon class="size-3.5" />
                {m.editor_saved({ time: savedAt.toLocaleTimeString() })}
            {/if}
        </span>
    </div>

    {#if kind === "document"}
        <!-- Browser only: ProseKit parses the initial HTML with DOMParser when
             the editor is constructed, and there is no DOM on the server. The
             other two editors are plain Svelte and render fine either way. -->
        {#if browser}
            <DocumentEditor content={data.content} onChange={queue} />
        {/if}
    {:else if kind === "sheet"}
        <SheetEditor content={data.content} onChange={queue} />
    {:else if kind === "presentation"}
        <DeckEditor content={data.content} onChange={queue} />
    {:else}
        <p class="text-muted-foreground text-sm">{m.editor_unsupported()}</p>
    {/if}
</div>
