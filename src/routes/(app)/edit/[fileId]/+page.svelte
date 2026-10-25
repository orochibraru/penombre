<script lang="ts">
	import { browser } from "$app/env";
	import { beforeNavigate, refreshAll } from "$app/navigation";
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	import DeckEditor from "#lib/components/editor/deck-editor.svelte";
	import DocumentEditor from "#lib/components/editor/document-editor.svelte";
	import SheetEditor from "#lib/components/editor/sheet-editor.svelte";
	import EditorShell from "#lib/components/editor/shell/editor-shell.svelte";
	import SlidesEditor from "#lib/components/editor/slides-editor.svelte";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import RequestSignaturesDialog from "#lib/components/signatures/request-signatures-dialog.svelte";
	import SignaturesPanel from "#lib/components/signatures/signatures-panel.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { renameDocument, saveDocument } from "#lib/document-requests.js";
	import {
		baseName,
		editorKindForName,
		kindForName,
		titleFromContent,
	} from "#lib/documents.js";
	import { m } from "#lib/paraglide/messages.js";
	import { locales } from "#lib/paraglide/runtime.js";
	import { locationFrom } from "#lib/storage-location.js";
	import { title } from "#lib/store/title.js";

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
	 * The names **New** gives, in every language: a file still called one
	 * takes its heading's name, whatever the heading was when it opened.
	 */
	const UNTITLED = new Set<string>(
		locales.flatMap((locale) => [
			m.new_document_title({}, { locale }),
			m.new_presentation_title({}, { locale }),
		]),
	);

	onMount(() => {
		title.set(name);
	});

	const kind = $derived(editorKindForName(name));

	let pending = $state<string | null>(null);
	let saving = $state(false);
	let saveError = $state(false);
	let savedAt = $state<Date | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	/** Bumped when the file is reread (a restored version): editors remount. */
	let generation = $state(0);

	/** The revision on disk after our last save, keyed like `renamed`. */
	let saved = $state<{ fileId: string; revision: string } | null>(null);
	const revision = $derived(
		saved?.fileId === data.fileId ? saved.revision : data.revision,
	);
	/** Someone else saved since this was opened: their revision, until we choose. */
	let theirs = $state<string | null>(null);

	const RETRY_MS = 5000;

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
		if (pending === null || saving || theirs !== null) {
			return;
		}
		const content = pending;
		pending = null;
		saving = true;
		// Never a version: only **Save as version** keeps one.
		const result = await saveDocument(
			{ id: data.fileId, name, contentType: data.contentType },
			content,
			revision,
		);
		saving = false;
		if (result && "theirs" in result) {
			pending ??= content;
			theirs = result.theirs;
			clearTimeout(timer);
		} else if (result) {
			saved = { fileId: data.fileId, revision: result.revision };
			saveError = false;
			savedAt = new Date();
			await syncName(content);
			// A keystroke landed while this save was in flight: its own timer
			// found `saving` still true and bailed out without rescheduling.
			// Pick it up now instead of waiting for another keystroke.
			if (pending !== null) {
				void flush();
			}
		} else {
			// Put it back so the retry (or the next keystroke) doesn't lose it.
			pending = content;
			saveError = true;
			toast.error(m.editor_save_error());
			clearTimeout(timer);
			timer = setTimeout(() => void flush(), RETRY_MS);
		}
	}

	/** Saves now, for everything that reads the saved file. */
	let signOpen = $state(false);
	let signaturesOpen = $state(false);
	let signaturesRefresh = $state(0);

	/** What people sign is frozen from the saved bytes: save what is on screen first. */
	async function askForSignatures() {
		await saveNow();
		signOpen = true;
	}

	async function saveNow() {
		clearTimeout(timer);
		await flush();
	}

	/**
	 * A name given by hand. The heading stops renaming the file from here
	 * on: an empty tracked title matches no name.
	 */
	async function renameTo(newTitle: string): Promise<boolean> {
		await saveNow();
		const newName = await renameDocument(data.fileId, name, newTitle);
		if (!newName) {
			toast.error(m.shell_rename_error());
			return false;
		}
		renamed = { fileId: data.fileId, name: newName, title: "" };
		title.set(newName);
		return true;
	}

	async function reread() {
		pending = null;
		theirs = null;
		saved = null;
		await refreshAll();
		generation++;
	}

	/** Our text over theirs, still refused if a third save lands first. */
	function keepMine(over: string) {
		saved = { fileId: data.fileId, revision: over };
		theirs = null;
		void flush();
	}

	/**
	 * Follow the document's heading with the file name, while the name is
	 * still New's or still the heading's. A name set by hand is left alone.
	 */
	async function syncName(content: string) {
		// A .pptx arrives as the deck's JSON, which has no heading to follow.
		if (kind === "presentation" && data.office) {
			return;
		}
		const heading = titleFromContent(kind, content);
		if (!heading || heading === trackedTitle) {
			return;
		}
		const base = baseName(name).replace(/ \(\d+\)$/, "");
		if (base !== trackedTitle && !UNTITLED.has(base)) {
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

	/**
	 * Saves everything typed, waiting out a save in flight; true once nothing
	 * is left unsaved. The mobile app calls it before closing its editor
	 * screen, whose web view may not live long enough to see `pagehide`.
	 */
	async function settle(): Promise<boolean> {
		clearTimeout(timer);
		for (let wait = 0; wait < 200 && (saving || pending !== null); wait++) {
			if (saving) {
				await new Promise((done) => setTimeout(done, 50));
			} else {
				await flush();
				if (theirs !== null || saveError) {
					break;
				}
			}
		}
		return pending === null && !saving;
	}

	onMount(() => {
		Object.assign(window, { penombreSettle: settle });
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

<!-- Keyed: comments, presence and the view/edit choice belong to one file,
     and each editor reads its content once. -->
{#key data.fileId}
	<EditorShell
		file={{
			fileId: data.fileId,
			path: data.path,
			name,
			kind,
			canWrite: data.canWrite,
			trackedChanges: data.trackedChanges,
			canShare: data.canShare,
		}}
		status={{
			saving,
			failed: saveError,
			pending: pending !== null,
			savedAt,
		}}
		flush={saveNow}
		onrename={renameTo}
		onrestored={() => void reread()}
		requestSignatures={data.canWrite
			? () => void askForSignatures()
			: undefined}
		signatures={() => (signaturesOpen = true)}
	>
		{#snippet editor(shell)}
			{#if kind === "document"}
				<!-- Browser only: ProseKit parses the initial HTML with DOMParser when
             the editor is constructed, and there is no DOM on the server. The
             other two editors are plain Svelte and render fine either way. -->
				{#if browser}
					{#key generation}
						<DocumentEditor
							content={data.content}
							onChange={queue}
							menu={shell.menu}
							readOnly={shell.readOnly}
							suggesting={shell.suggesting}
							author={page.data.user
								? { id: page.data.user.id, name: page.data.user.name }
								: undefined}
							comments={shell.comments}
						/>
					{/key}
				{/if}
			{:else if kind === "sheet"}
				<!-- Keyed: the grid reads its content once, so a restored
             version needs a new one, not the old cells saved over it. -->
				{#key generation}
					<SheetEditor
						content={data.content}
						onChange={queue}
						workbook={data.office}
						menu={shell.menu}
						readOnly={shell.readOnly}
						comments={shell.comments}
					/>
				{/key}
			{:else if kind === "presentation"}
				{#if data.office}
					<!-- Keyed: the slide editor reads its deck once, so a restored
                 version needs a new one. -->
					{#key `${data.fileId}:${generation}`}
						<SlidesEditor
							content={data.content}
							onChange={queue}
							fileId={data.fileId}
							menu={shell.menu}
							readOnly={shell.readOnly}
							comments={shell.comments}
						/>
					{/key}
				{:else}
					{#key generation}
						<DeckEditor
							content={data.content}
							onChange={queue}
							menu={shell.menu}
							readOnly={shell.readOnly}
							comments={shell.comments}
						/>
					{/key}
				{/if}
			{:else}
				<Menubar.Root class="mb-2 w-fit">
					{@render shell.menu({})}
				</Menubar.Root>
				{#key generation}
					<Textarea
						value={data.content}
						oninput={(event) => queue(event.currentTarget.value)}
						readonly={shell.readOnly}
						spellcheck="false"
						class="min-h-0 flex-1 resize-none font-mono text-sm"
					/>
				{/key}
			{/if}
		{/snippet}
	</EditorShell>
{/key}

<!-- Dismissed means "later": the next save is refused again and asks again. -->
<ResponsiveDialog
	bind:open={() => theirs !== null, (open) => !open && (theirs = null)}
	title={m.editor_conflict_title()}
	description={name}
>
	{#snippet footer()}
		<Button variant="outline" onclick={() => void reread()}>
			{m.editor_conflict_theirs()}
		</Button>
		<Button onclick={() => theirs !== null && keepMine(theirs)}>
			{m.editor_conflict_mine()}
		</Button>
	{/snippet}
	<p class="text-muted-foreground text-sm">{m.editor_conflict_body()}</p>
</ResponsiveDialog>

{#if kind === "document"}
	<RequestSignaturesDialog
		bind:open={signOpen}
		fileId={data.fileId}
		fileName={name}
		location={locationFrom(page.params, page.url)}
		onSent={() => signaturesRefresh++}
	/>
	<ResponsiveDialog
		bind:open={signaturesOpen}
		title={m.sign_menu_status()}
		description={name}
		bodyClass="max-h-[70vh]"
	>
		<SignaturesPanel fileId={data.fileId} refresh={signaturesRefresh} />
	</ResponsiveDialog>
{/if}
