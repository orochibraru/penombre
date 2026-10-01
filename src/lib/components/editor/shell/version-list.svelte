<script lang="ts">
	import { DownloadIcon, RotateCcwIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { locationFrom, locationQuery } from "#lib/storage-location.js";
	import { readableFileSize } from "#lib/utils.js";
	import { type ListedVersion, versionLabel } from "#lib/versions.js";
	import { page } from "$app/state";

	/**
	 * A file's versions from inside its editor: download any, restore one.
	 * The listing's own history modal previews in place, which an open
	 * editor has no room for.
	 */
	let {
		open = $bindable(false),
		fileId,
		name,
		canWrite,
		onrestore,
	}: {
		open: boolean;
		fileId: string;
		name: string;
		canWrite: boolean;
		/** Before a restore: the editor saves what is on screen. */
		onrestore: (versionId: string) => Promise<void>;
	} = $props();

	let versions = $state<ListedVersion[] | null>(null);
	let restoring = $state<string | null>(null);
	const naming = $derived(page.data.preferences?.versionNaming);

	$effect(() => {
		if (!open) {
			return;
		}
		versions = null;
		void api
			.GET("/api/v1/storage/file/{id}/versions", {
				params: { path: { id: fileId } },
			})
			.then(({ data, error }) => {
				if (error) {
					toast.error(m.versions_load_error());
				}
				versions = data?.data?.versions ?? [];
			});
	});

	function href(version: ListedVersion): string {
		const location = locationQuery(locationFrom(page.params, page.url));
		return `/api/v1/storage/file/${encodeURIComponent(fileId)}/versions/${encodeURIComponent(version.id)}/raw?download=1${location ? `&${location}` : ""}`;
	}

	async function restore(version: ListedVersion) {
		restoring = version.id;
		await onrestore(version.id);
		restoring = null;
		open = false;
	}
</script>

<ResponsiveDialog bind:open title={m.shell_version_history()} description={name} size="md">
    <p class="text-muted-foreground mb-3 text-xs">{m.versions_restore_hint()}</p>
    <ul class="flex min-w-0 flex-col divide-y rounded-lg border">
        <li class="flex min-w-0 items-center gap-2 p-3">
            <span class="font-medium">{m.shell_current_version()}</span>
            <Badge>{m.versions_latest()}</Badge>
        </li>
        {#each versions ?? [] as version (version.id)}
            <li class="flex min-w-0 items-center gap-2 p-2 ps-3">
                <span class="min-w-0 flex-1">
                    <span class="block font-medium tabular-nums">
                        {versionLabel(naming, version.seq, version.createdAt)}
                    </span>
                    <span class="text-muted-foreground block truncate text-xs">
                        {new Date(version.createdAt).toLocaleString()}
                        · {readableFileSize(version.size)}
                        {#if version.authorName}· {version.authorName}{/if}
                    </span>
                </span>
                <a
                    class={buttonVariants({ variant: "ghost", size: "icon" })}
                    href={href(version)}
                    download={name}
                    aria-label={m.shell_download()}
                    title={m.shell_download()}
                >
                    <DownloadIcon class="size-4" />
                </a>
                {#if canWrite}
                    <Button
                        variant="outline"
                        size="sm"
                        loading={restoring === version.id}
                        disabled={restoring !== null}
                        onclick={() => void restore(version)}
                    >
                        <RotateCcwIcon class="size-3.5" />
                        {m.shell_restore()}
                    </Button>
                {/if}
            </li>
        {:else}
            <li class="text-muted-foreground p-3 text-sm">
                {versions ? m.versions_empty() : m.versions_loading()}
            </li>
        {/each}
    </ul>
</ResponsiveDialog>
