<script lang="ts">
	import { CheckIcon, LoaderIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import DeckEditor from "#lib/components/editor/deck-editor.svelte";
	import DocumentEditor from "#lib/components/editor/document-editor.svelte";
	import SheetEditor from "#lib/components/editor/sheet-editor.svelte";
	import {
		baseName,
		editorKindForName,
		kindForName,
		renameDocument,
		saveDocument,
		titleFromContent,
	} from "#lib/documents.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { browser } from "$app/env";
	import { beforeNavigate } from "$app/navigation";

	const { data } = $props();

	/**
	 * A rename this page made itself, keyed by file id so that opening another
	 * document does not inherit the previous one's name.
	 */
	let renamed = $state<{
		fileId: string;
		name: string;
		title: string;
	} | null>(null);

	const ours = $derived(renamed?.fileId === data.fileId ? renamed : null);
	const name = $derived(ours?.name ?? data.name);

	/**
	 * The heading the file name mirrors: the document's own when it loaded, or
	 * whatever we last renamed it to. Null, or anything else, means the two
	 * have diverged. A file renamed by hand belongs to whoever renamed it.
	 */
	const trackedTitle = $derived(
		ours?.title ?? titleFromContent(kindForName(data.name), data.content),
	);

	/**
	 * The smart rename is for Penombre's own documents only. A `.docx` is
	 * named by whoever wrote it, and having its heading quietly rename the
	 * file is not what anyone expects of a Word file — so the rename reads
	 * the native kind, not the editor's.
	 */
	const nativeKind = $derived(kindForName(name));

	onMount(() => {
		title.set(name);
	});

	const kind = $derived(editorKindForName(name));

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
		const ok = await saveDocument(data.fileId, name, data.contentType, content);
		saving = false;
		if (ok) {
			savedAt = new Date();
			await syncName(content);
		} else {
			// Put it back so the next tick retries rather than losing the edit.
			pending = content;
			toast.error(m.editor_save_error());
		}
	}

	/** Follow the document's heading with the file name. */
	async function syncName(content: string) {
		const heading = titleFromContent(nativeKind, content);
		if (!heading || heading === trackedTitle) {
			return;
		}
		if (baseName(name).replace(/ \(\d+\)$/, "") !== trackedTitle) {
			return;
		}
		const newName = await renameDocument(data.fileId, name, heading);
		if (!newName) {
			return;
		}
		renamed = { fileId: data.fileId, name: newName, title: heading };
		title.set(newName);
	}

	beforeNavigate(({ shallow }) => {
		if (shallow) {
			return;
		}

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
></svelte:window>

<div class="flex h-[calc(100vh-8rem)] w-full flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 flex-col">
            <h1 class="truncate text-lg font-medium">{name}</h1>
            {#if data.office}
                <!-- The bargain of editing a Word file in something that is
                     not Word, said once, where it is about to happen. -->
                <p class="text-muted-foreground text-xs">
                    {m.editor_office_note()}
                </p>
			{/if}
		</div>
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
