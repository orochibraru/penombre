<script lang="ts">
	import { EllipsisVerticalIcon, HistoryIcon } from "@lucide/svelte";
	import type { ObjectItem } from "#lib/api/index.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import {
		historyFor,
		loadVersions,
		versionsChanged,
	} from "#lib/store/versions.js";
	import { readableFileSize } from "#lib/utils.js";
	import {
		type ListedVersion,
		versionItem,
		versionLabel,
	} from "#lib/versions.js";
	import { page } from "$app/state";
	import { actionsFor } from "./version-actions.js";

	/** The grid's view of a file's versions: tiles do not unfold. */
	const { onopen }: { onopen: (item: ObjectItem) => void } = $props();

	let versions = $state<ListedVersion[] | null>(null);
	let open = $state(false);
	const file = $derived($historyFor);
	const naming = $derived(page.data.preferences?.versionNaming);

	$effect(() => {
		open = !!file;
	});
	$effect(() => {
		if (!open) {
			historyFor.set(null);
		}
	});
	$effect(() => {
		void $versionsChanged;
		const id = file?.metadata.id;
		versions = null;
		if (id) {
			void loadVersions(id).then((loaded) => {
				if ($historyFor?.metadata.id === id) {
					versions = loaded;
				}
			});
		}
	});
</script>

<ResponsiveDialog
    bind:open
    title={m.versions_title()}
    description={file?.metadata.name ?? ""}
    size="md"
>
    {#if file}
        <ul class="flex min-w-0 flex-col divide-y rounded-lg border">
            <li class="flex min-w-0 items-center gap-3 p-3">
                <HistoryIcon class="text-primary size-4 shrink-0" />
                <span class="font-medium">
                    {versionLabel(
                        naming,
                        (file.metadata.versionSeq ?? 0) + 1,
                        file.updatedAt ?? file.metadata.createdAt,
                    )}
                </span>
                <Badge>{m.versions_latest()}</Badge>
                <span class="text-muted-foreground ml-auto text-xs">
                    {readableFileSize(file.size ?? 0)}
                </span>
            </li>
            {#each versions ?? [] as version (version.id)}
                {@const item = versionItem(file, version)}
                <li class="flex min-w-0 items-center gap-1 pr-1">
                    <!-- Opens like the file would: previews, or plays. -->
                    <button
                        type="button"
                        class="hover:bg-muted/50 flex min-w-0 flex-1 items-baseline gap-2 p-3 text-start"
                        onclick={() => {
							// A track plays underneath; anything else opens a
							// preview, which should not stack on this dialog.
							if (item.metadata.category !== "MUSIC") {
								historyFor.set(null);
							}
							onopen(item);
						}}
                    >
                        <span class="shrink-0 font-medium tabular-nums">
                            {versionLabel(naming, version.seq, version.createdAt)}
                        </span>
                        <span class="text-muted-foreground truncate text-xs">
                            {readableFileSize(version.size)}
                            · {new Date(version.createdAt).toLocaleString()}
                            {#if version.authorName}· {version.authorName}{/if}
                        </span>
                    </button>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                                <Button variant="ghost" size="icon" {...props}>
                                    <EllipsisVerticalIcon />
                                    <span class="sr-only">{m.open_menu()}</span>
                                </Button>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                            {#each actionsFor(item, []) as group}
                                <DropdownMenu.Group>
                                    {#each group.actions as act}
                                        <DropdownMenu.Item
                                            onclick={() => act.action(item)}
                                            variant={act.variant}
                                        >
                                            <act.icon class={act.iconClass} />
                                            {act.title}
                                        </DropdownMenu.Item>
                                    {/each}
                                </DropdownMenu.Group>
                            {/each}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </li>
            {:else}
                <li class="text-muted-foreground p-3 text-sm">
                    {versions ? m.versions_empty() : m.versions_loading()}
                </li>
            {/each}
        </ul>
    {/if}
</ResponsiveDialog>
