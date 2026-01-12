<script lang="ts">
    import { EllipsisVerticalIcon } from "@lucide/svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import type { ObjectItem } from "$lib/api-client";
    import FilePrefix from "$lib/components/file/prefix.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Skeleton } from "$lib/components/ui/skeleton/index";
    import { route } from "$lib/ROUTES";
    import {
        cn,
        isFolderItem,
        type SharedFileDisplayProps,
        shouldDisplayAction,
    } from "$lib/utils";

    let {
        handleOpenItem,
        files,
        actionableItem = $bindable(),
        actionsContextOpen = $bindable(false),
        allSelected = $bindable(false),
        indeterminate,
        loading = $bindable(false),
        checkedItems = $bindable(),
        searchValue,
        searchResults,
        itemActions,
    }: SharedFileDisplayProps = $props();

    const iconSize = "h-36 w-36";
    const loadingAmount = 20;

    function isChecked(item: ObjectItem): boolean {
        return checkedItems[item.key] || false;
    }
</script>

{#snippet listItem(objectItem: ObjectItem)}
    {@const checked = isChecked(objectItem)}
    {@const isFolder = isFolderItem(objectItem)}
    <li
        class={cn(
            "flex items-end justify-between rounded-xl border p-5 transition-colors",
            checked ? "bg-primary/5" : "",
        )}
    >
        <ContextMenu.Root>
            <ContextMenu.Trigger class="h-full w-full">
                <div
                    class="flex h-full flex-col items-start justify-center gap-2"
                    role="button"
                    tabindex={-1}
                    ontap={() => {
                        if (isFolder) {
                            const folder = objectItem.key.replace("/", "");
                            goto(
                                route("/browse/[...path]", {
                                    path: page.params.path
                                        ? [page.params.path, folder]
                                        : [folder],
                                }),
                            );
                            return;
                        }

                        handleOpenItem(objectItem);
                    }}
                >
                    <FilePrefix
                        bind:checkedItems
                        {indeterminate}
                        item={objectItem}
                        {handleOpenItem}
                        {iconSize}
                        layout="grid"
                    />
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
                {#each itemActions as action}
                    <ContextMenu.Group>
                        {#each action.actions as act}
                            {#if shouldDisplayAction( { action: act, item: objectItem }, )}
                                {@const Icon = act.icon}
                                <ContextMenu.Item
                                    onclick={() => act.action(objectItem)}
                                    disabled={act.disabled}
                                    variant={act.variant}
                                >
                                    <Icon />
                                    {act.title}
                                </ContextMenu.Item>
                            {/if}
                        {/each}
                    </ContextMenu.Group>
                    {@const isLast =
                        action === itemActions[itemActions.length - 1]}
                    {#if !isLast}
                        <ContextMenu.Separator />
                    {/if}
                {/each}
            </ContextMenu.Content>
        </ContextMenu.Root>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                class="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            >
                {#snippet child({ props })}
                    <Button variant="ghost" size="icon" {...props}>
                        <EllipsisVerticalIcon />
                        <span class="sr-only">Open menu</span>
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                {#each itemActions as action}
                    <DropdownMenu.Group>
                        {#each action.actions as act}
                            {#if shouldDisplayAction( { action: act, item: objectItem }, )}
                                {@const Icon = act.icon}
                                <DropdownMenu.Item
                                    onclick={() => act.action(objectItem)}
                                    disabled={act.disabled}
                                    variant={act.variant}
                                >
                                    <Icon />
                                    {act.title}
                                </DropdownMenu.Item>
                            {/if}
                        {/each}
                    </DropdownMenu.Group>
                    {@const isLast =
                        action === itemActions[itemActions.length - 1]}
                    {#if !isLast}
                        <DropdownMenu.Separator />
                    {/if}
                {/each}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </li>
{/snippet}

{#snippet emptyListItem()}
    <li class="flex items-center justify-between py-3">
        <p>No results.</p>
    </li>
{/snippet}

{#snippet loadingRows()}
    {#each Array(loadingAmount) as _}
        <li class="flex items-center justify-between py-3">
            <Skeleton class="h-7.5 w-full rounded-sm" />
        </li>
    {/each}
{/snippet}

<ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    {#if loading}
        {@render loadingRows()}
    {:else if searchValue}
        {#if searchResults.length > 0}
            {#each searchResults as objectItem}
                {@render listItem(objectItem)}
            {/each}
        {:else}
            {@render emptyListItem()}
        {/if}
    {:else if files.count > 0}
        {#each files.list as objectItem}
            {@render listItem(objectItem)}
        {/each}
    {:else}
        {@render emptyListItem()}
    {/if}
</ul>
