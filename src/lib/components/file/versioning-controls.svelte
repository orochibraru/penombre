<script lang="ts">
	import { FolderCogIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api, type ObjectItem } from "#lib/api/index.js";
	import FolderSettingsDialog from "#lib/components/file/folder-settings-dialog.svelte";
	import VersionHistoryDialog from "#lib/components/file/version-history-dialog.svelte";
	import MergeVersionsDialog from "#lib/components/layout/dialogs/merge-versions-dialog.svelte";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { locationOf } from "#lib/storage-location.js";
	import {
		pendingVersionAction,
		refreshVersions,
	} from "#lib/store/versions.js";
	import { enqueueUploads } from "#lib/upload/manager.js";
	import { isFolderItem, randomId } from "#lib/utils.js";
	import { displayTitle, versionOf } from "#lib/versions.js";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";

	/** The folder settings button, the new-version picker and their dialogs. */
	const {
		currentFolder,
		isTrash,
		onopen,
	}: {
		currentFolder: string;
		isTrash: boolean;
		/** How the listing opens a file; the modal's versions open the same way. */
		onopen: (item: ObjectItem) => void;
	} = $props();

	const showButton = $derived(
		!!(page.data.versioning && currentFolder && !isTrash),
	);

	let folderSettings = $state({ open: false, id: "", name: "" });
	let picker = $state<HTMLInputElement>();
	let replacing: ObjectItem | null = null;
	let busy = $state(false);

	const pending = $derived($pendingVersionAction);
	const pendingVersion = $derived(
		pending ? versionOf(pending.item) : undefined,
	);
	let confirmOpen = $state(false);
	$effect(() => {
		confirmOpen = !!pending;
	});
	$effect(() => {
		if (!confirmOpen) {
			pendingVersionAction.set(null);
		}
	});

	/** Folder settings for a folder, a new version for a file. */
	export async function open(item: ObjectItem) {
		if (isFolderItem(item)) {
			folderSettings = {
				open: true,
				id: item.metadata.id,
				name: item.metadata.name ?? item.key,
			};
			return;
		}
		// In a folder that does not version, a new upload would simply
		// replace the file and keep nothing.
		const { data } = await api.GET("/api/v1/storage/file/{id}/versions", {
			params: { path: { id: item.metadata.id } },
		});
		if (!data?.data?.versioning.enabled) {
			toast.info(m.versions_not_kept());
			return;
		}
		replacing = item;
		picker?.click();
	}

	async function uploadNewVersion(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		const item = replacing;
		input.value = "";
		if (!(file && item)) {
			return;
		}
		await enqueueUploads([
			{
				id: randomId(),
				fileId: item.metadata.id,
				finalName: currentFolder ? `${currentFolder}/${item.key}` : item.key,
				rowKey: item.key,
				location: locationOf(page.params),
				displayName: item.metadata.name ?? item.key,
				size: file.size,
				file,
				status: "pending",
				createdAt: Date.now(),
			},
		]);
	}

	async function confirm() {
		if (!(pending && pendingVersion)) {
			return;
		}
		busy = true;
		const params = {
			path: { id: pendingVersion.fileId, versionId: pendingVersion.id },
		};
		const { error } =
			pending.action === "restore"
				? await api.POST(
						"/api/v1/storage/file/{id}/versions/{versionId}/restore",
						{ params },
					)
				: await api.DELETE("/api/v1/storage/file/{id}/versions/{versionId}", {
						params,
					});
		busy = false;
		if (error) {
			toast.error(
				pending.action === "restore"
					? m.versions_restore_error()
					: m.versions_delete_error(),
			);
			return;
		}
		if (pending.action === "restore") {
			toast.success(m.versions_restored());
		}
		confirmOpen = false;
		await Promise.all([
			refreshVersions(pendingVersion.fileId),
			invalidate("app:files"),
		]);
	}
</script>

<input
    bind:this={picker}
    type="file"
    class="hidden"
    aria-hidden="true"
    tabindex="-1"
    onchange={uploadNewVersion}
/>

{#if showButton}
    <Button
        variant="outline"
        title={m.folder_settings_title()}
        onclick={() =>
            (folderSettings = { open: true, id: currentFolder, name: "" })}
    >
        <FolderCogIcon class="h-4 w-4" />
        <span class="sr-only">{m.folder_settings_title()}</span>
    </Button>
{/if}

<VersionHistoryDialog {onopen} />
<MergeVersionsDialog />

<FolderSettingsDialog
    bind:open={folderSettings.open}
    folderId={folderSettings.id}
    folderName={folderSettings.name}
/>

<ResponsiveDialog
    bind:open={confirmOpen}
    size="sm"
    loading={busy}
    title={pending?.action === "delete"
        ? m.versions_delete()
        : m.versions_restore()}
    description={pending
        ? displayTitle(pending.item, page.data.preferences?.versionNaming)
        : ""}
    submitLabel={pending?.action === "delete"
        ? m.versions_confirm_delete()
        : m.versions_confirm_restore()}
    submitVariant={pending?.action === "delete" ? "destructive" : "default"}
    onsubmit={confirm}
>
    <p class="text-muted-foreground text-sm">
        {pending?.action === "delete"
            ? m.versions_delete_hint()
            : m.versions_restore_hint()}
    </p>
</ResponsiveDialog>
