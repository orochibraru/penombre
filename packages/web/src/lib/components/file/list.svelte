<script lang="ts">
    import { EllipsisVerticalIcon } from "@lucide/svelte";
    import type { ObjectItem } from "$lib/api-client";
    import FilePrefix from "$lib/components/file/prefix.svelte";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import { Skeleton } from "$lib/components/ui/skeleton/index";
    import {
        cn,
        type SharedFileDisplayProps,
        shouldDisplayAction,
    } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";

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

    const iconSize = "h-6 w-6";
    const loadingAmount = 20;

    function isChecked(item: ObjectItem): boolean {
        return checkedItems[item.key] || false;
    }
</script>

{#snippet listItem(item: ObjectItem)}
    {@const checked = isChecked(item)}
    <li
        class={cn(
            "flex items-center justify-between rounded-xl px-1 py-3 transition-colors",
            checked ? "bg-primary/5" : "",
        )}
    >
        <FilePrefix
            layout="list"
            bind:checkedItems
            {indeterminate}
            {item}
            {handleOpenItem}
            {iconSize}
        />
        <button
            onclick={() => {
                actionableItem = item;
                actionsContextOpen = true;
            }}
            class="py-1 pl-5"
        >
            <EllipsisVerticalIcon class="h-5 w-5" />
        </button>
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
            <Skeleton class="h-[30px] w-full rounded-sm" />
        </li>
    {/each}
{/snippet}

<ul class="flex flex-col gap-1">
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

<Drawer.Root bind:open={actionsContextOpen}>
    <Drawer.Content class="z-50">
        <Drawer.Header>
            {#if actionableItem}
                <Drawer.Title class="border-b pb-3 text-lg">
                    {actionableItem.key.endsWith("/")
                        ? actionableItem.key.slice(0, -1)
                        : actionableItem.key}
                </Drawer.Title>
            {/if}
        </Drawer.Header>
        <Drawer.Footer>
            <div class="mx-auto flex w-full flex-col items-start gap-5 pb-5">
                {#if actionableItem}
                    {@const item = actionableItem}
                    {#each itemActions as action}
                        {#each action.actions as act}
                            {#if shouldDisplayAction({ action: act, item })}
                                {@const Icon = act.icon}
                                <button
                                    onclick={() => act.action(item)}
                                    disabled={act.disabled}
                                    class={cn(
                                        "disabled:text-muted-foreground hover:text-primary flex w-full text-md items-center justify-start gap-3 text-balance transition-colors",
                                        act.variant === "destructive"
                                            ? "text-red-600 hover:text-red-800 disabled:text-red-300"
                                            : "",
                                    )}
                                >
                                    <Icon />
                                    {act.title}
                                </button>
                            {/if}
                        {/each}
                        {@const isLast =
                            action === itemActions[itemActions.length - 1]}
                        {#if !isLast}
                            <hr
                                class="my-2 w-full border-muted-foreground/30"
                            />
                        {/if}
                    {/each}
                {/if}
            </div>
        </Drawer.Footer>
    </Drawer.Content>
</Drawer.Root>
