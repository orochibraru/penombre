<script lang="ts">
	import { browser } from "$app/env";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { type Snippet, untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { MediaQuery } from "svelte/reactivity";

	import { api, type ObjectItem } from "#lib/api/index.js";
	import ShareDialog from "#lib/components/layout/dialogs/share-dialog.svelte";
	import * as Drawer from "#lib/components/ui/drawer/index.js";
	import {
		type DocumentKind,
		type ExportFormat,
		exportFormatsFor,
	} from "#lib/documents.js";
	import { downloadExport, downloadOriginal } from "#lib/editor/export.js";
	import { m } from "#lib/paraglide/messages.js";
	import { APP_USER_AGENT } from "#lib/release.js";
	import { locationFrom, locationQuery } from "#lib/storage-location.js";

	import CommentsPanel from "./comments-panel.svelte";
	import { Comments } from "./comments.svelte.js";
	import EditorHeader from "./editor-header.svelte";
	import type {
		EditorMenuContext,
		EditorMode,
		FileActions,
		SaveStatus,
		ShellContext,
	} from "./file-actions.js";
	import FileMenu from "./file-menu.svelte";
	import { Presence } from "./presence.svelte.js";
	import RenameDialog from "./rename-dialog.svelte";
	import VersionList from "./version-list.svelte";

	/**
	 * Everything around an office editor: the header, the File menu, view and
	 * edit, comments, who else is here, and the dialogs those open. The page
	 * keeps the saving; the editor itself comes in as `editor`.
	 *
	 * Mounted once per file (the page keys it), so its threads, heartbeat
	 * and mode never leak from one file into the next.
	 */
	const {
		file,
		status,
		flush,
		onrename,
		onrestored,
		requestSignatures,
		signatures,
		editor,
	}: {
		file: {
			fileId: string;
			path: string;
			name: string;
			kind: DocumentKind | null;
			canWrite: boolean;
			canShare: boolean;
			/** Read-only: Word changes the editor cannot keep (moves, formatting). */
			trackedChanges?: boolean;
		};
		status: SaveStatus;
		/** Saves what is on screen now. */
		flush: () => Promise<void>;
		onrename: (title: string) => Promise<boolean>;
		/** A version was restored: the editor must reread the file. */
		onrestored: () => void;
		requestSignatures?: () => void;
		signatures?: () => void;
		editor: Snippet<[ShellContext]>;
	} = $props();

	const fileId = untrack(() => file.fileId);
	const MODE_KEY = `penombre:editor-mode:${fileId}`;

	// =====================================================================
	// View or edit
	// =====================================================================

	let chosen = $state<EditorMode>("edit");
	const mode: EditorMode = $derived(
		!file.canWrite
			? "view"
			: chosen === "suggest" && file.kind !== "document"
				? "edit"
				: chosen,
	);

	// Read after mount: the server rendered edit, and a mismatch would
	// flash the other layout while hydrating.
	$effect(() => {
		try {
			const saved = localStorage.getItem(MODE_KEY);
			if (saved === "view" || saved === "suggest") {
				chosen = saved;
			}
		} catch {
			// Storage refused: the default stands.
		}
	});

	function setMode(next: EditorMode) {
		chosen = next;
		try {
			localStorage.setItem(MODE_KEY, next);
		} catch {
			// A private window: remembered for this visit only.
		}
		if (next === "view") {
			void flush();
		}
	}

	// =====================================================================
	// Comments and presence
	// =====================================================================

	const comments = new Comments(fileId);
	let presence = $state.raw<Presence | null>(null);

	$effect(() => {
		void comments.refresh();
		const beat = new Presence(
			fileId,
			() => (mode === "view" ? "viewing" : "editing"),
			// Someone else is here: their comments may be new.
			(others) => {
				if (others.length > 0) {
					void comments.refresh();
				}
			},
		);
		presence = beat;
		return untrack(() => beat.start());
	});

	// Switching mode tells the others at once, not in 15 seconds.
	let told: EditorMode | null = null;
	$effect(() => {
		const now = mode;
		if (told !== null && told !== now) {
			untrack(() => void presence?.beat());
		}
		told = now;
	});

	const desktop = new MediaQuery("(min-width: 768px)");

	/** In the mobile app's editor screen, whose native header names the file. */
	const embedded = $derived(page.url.searchParams.has("embed"));

	// =====================================================================
	// The File menu
	// =====================================================================

	let renameOpen = $state(false);
	let shareOpen = $state(false);
	let historyOpen = $state(false);

	/** Printing and saving blobs; the mobile app's web view has neither. */
	const downloads = browser && !navigator.userAgent.includes(APP_USER_AGENT);

	const location = () => locationQuery(locationFrom(page.params, page.url));

	async function makeCopy() {
		await flush();
		const { data, error } = await api.POST(
			"/api/v1/storage/file/{id}/duplicate",
			{ params: { path: { id: file.path } } },
		);
		const copy = data?.data?.metadata.id;
		if (error || !copy) {
			toast.error(m.shell_copy_error());
			return;
		}
		const embed = embedded
			? `embed=1&theme=${page.url.searchParams.get("theme") ?? ""}`
			: "";
		const query = [location(), embed].filter(Boolean).join("&");
		const href = resolve("/(app)/edit/[fileId]", { fileId: copy });
		await goto(query ? `${href}?${query}` : href);
	}

	async function download(format?: ExportFormat) {
		await flush();
		const refusal = format
			? await downloadExport(fileId, file.name, format)
			: await downloadOriginal(fileId, file.name);
		if (refusal !== null) {
			toast.error(m.office_export_error(), {
				description: refusal || undefined,
			});
		}
	}

	async function saveVersion() {
		await flush();
		const { error } = await api.POST("/api/v1/storage/file/{id}/versions", {
			params: { path: { id: fileId } },
		});
		if (error) {
			toast.error(m.versions_save_error());
		} else {
			toast.success(m.versions_saved());
		}
	}

	async function restore(versionId: string) {
		await flush();
		const { error } = await api.POST(
			"/api/v1/storage/file/{id}/versions/{versionId}/restore",
			{ params: { path: { id: fileId, versionId } } },
		);
		if (error) {
			toast.error(m.versions_restore_error());
			return;
		}
		toast.success(m.versions_restored());
		onrestored();
	}

	const actions: FileActions = $derived({
		kind: file.kind,
		exports: exportFormatsFor(file.name),
		canWrite: file.canWrite,
		canShare: file.canShare,
		versioning: !!page.data.versioning,
		downloads,
		rename: () => (renameOpen = true),
		copy: () => void makeCopy(),
		download: () => void download(),
		exportAs: (format) => void download(format),
		share: () => (shareOpen = true),
		saveVersion: () => void saveVersion(),
		history: () => (historyOpen = true),
		requestSignatures,
		signatures,
	});

	/** What the share dialog needs of a listing row. */
	const shareItem = $derived({
		key: file.name,
		metadata: { id: fileId, name: file.name },
	} as ObjectItem);

	const context: ShellContext = {
		menu: fileMenu,
		get readOnly() {
			return mode === "view";
		},
		get suggesting() {
			return mode === "suggest";
		},
		comments,
	};
</script>

{#snippet fileMenu(editorContext: EditorMenuContext)}
	<FileMenu file={actions} print={editorContext.print} />
{/snippet}

{#snippet panel()}
	<CommentsPanel
		{comments}
		userId={page.data.user?.id}
		onclose={() => (comments.panelOpen = false)}
	/>
{/snippet}

<div
	class={embedded
		? "flex h-[calc(100dvh-0.5rem)] w-full flex-col gap-2"
		: "flex h-[calc(100dvh-8rem)] w-full flex-col gap-3"}
>
	<EditorHeader
		name={file.name}
		showName={!embedded}
		touch={embedded}
		canWrite={file.canWrite}
		trackedChanges={file.trackedChanges}
		suggest={file.kind === "document"}
		{mode}
		onmode={setMode}
		{status}
		people={presence?.others ?? []}
		comments={{
			count: comments.unresolved.length,
			open: comments.panelOpen,
			toggle: () => (comments.panelOpen = !comments.panelOpen),
		}}
		{onrename}
	/>

	<div class="flex min-h-0 flex-1 gap-3">
		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			{@render editor(context)}
		</div>
		{#if desktop.current && comments.panelOpen}
			<aside class="flex min-h-0 w-80 shrink-0 flex-col border-s ps-3">
				{@render panel()}
			</aside>
		{/if}
	</div>
</div>

{#if !desktop.current}
	<Drawer.Root bind:open={comments.panelOpen}>
		<Drawer.Content class="h-[80dvh] px-4 pb-4">
			<Drawer.Title class="sr-only">{m.shell_comments()}</Drawer.Title>
			{@render panel()}
		</Drawer.Content>
	</Drawer.Root>
{/if}

<RenameDialog bind:open={renameOpen} name={file.name} {onrename} />
<ShareDialog bind:open={shareOpen} item={shareItem} />
<VersionList
	bind:open={historyOpen}
	{fileId}
	name={file.name}
	canWrite={file.canWrite}
	onrestore={restore}
/>
