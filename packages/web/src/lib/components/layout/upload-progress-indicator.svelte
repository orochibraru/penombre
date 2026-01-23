<script lang="ts">
    import {
        CheckIcon,
        ChevronDownIcon,
        ChevronUpIcon,
        MinimizeIcon,
        XIcon,
    } from "@lucide/svelte";
    import { fly, slide } from "svelte/transition";
    import { Button } from "$lib/components/ui/button";
    import { Progress } from "$lib/components/ui/progress";
    import { cn } from "$lib/utils";
    import {
        globalUploadProgress,
        uploadedItems,
        uploadingItems,
        uploadingItemsNames,
    } from "$lib/store/upload";

    let expanded = $state(true);
    let isCompleted = $derived(
        !$globalUploadProgress.isUploading &&
            Object.keys($uploadedItems).length > 0,
    );

    function dismiss() {
        uploadedItems.set({});
        uploadingItems.set({});
        uploadingItemsNames.set({});
    }

    function toggleExpanded() {
        expanded = !expanded;
    }
</script>

{#if $globalUploadProgress.isUploading || isCompleted}
    <div
        transition:fly={{ y: 100, duration: 300 }}
        class={cn(
            "fixed bottom-4 right-4 z-50 w-80 rounded-lg border bg-background shadow-2xl",
            "md:bottom-6 md:right-6",
        )}
    >
        <!-- Header -->
        <div
            class="flex items-center justify-between border-b bg-muted/30 px-4 py-3"
        >
            <button
                onclick={toggleExpanded}
                class="flex flex-1 items-center gap-2 text-left transition-colors hover:text-primary"
            >
                {#if isCompleted}
                    <div class="flex items-center gap-2">
                        <CheckIcon class="size-5 text-green-600" />
                        <div>
                            <p class="font-medium">Upload complete</p>
                            <p class="text-sm">
                                {Object.keys($uploadedItems).length} items
                            </p>
                        </div>
                    </div>
                {:else}
                    <span class="font-medium">
                        Uploading {$globalUploadProgress.count}
                        {$globalUploadProgress.count === 1 ? "item" : "items"}
                    </span>
                {/if}
            </button>

            <div class="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    onclick={toggleExpanded}
                >
                    {#if expanded}
                        <ChevronDownIcon class="size-4" />
                    {:else}
                        <ChevronUpIcon class="size-4" />
                    {/if}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0"
                    onclick={dismiss}
                >
                    <XIcon class="size-4" />
                </Button>
            </div>
        </div>

        <!-- Content -->
        {#if expanded}
            <div
                transition:slide={{ duration: 200 }}
                class="max-h-80 overflow-y-auto p-4"
            >
                {#if isCompleted}
                    <div class="space-y-2">
                        {#each Object.entries($uploadedItems) as [key, item]}
                            <div
                                class="flex items-center gap-2 rounded-md bg-muted/30 p-2 text-sm"
                            >
                                <CheckIcon
                                    class="size-4 shrink-0 text-green-600"
                                />
                                <span class="flex-1 truncate">
                                    {item.metadata.name || key}
                                </span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="mb-3">
                        <div
                            class="mb-1 flex items-center justify-between text-sm"
                        >
                            <span class="text-muted-foreground">
                                Overall progress
                            </span>
                            <span class="font-medium">
                                {$globalUploadProgress.progress}%
                            </span>
                        </div>
                        <Progress
                            value={$globalUploadProgress.progress}
                            class="h-2"
                        />
                    </div>

                    <div class="space-y-2">
                        {#each Object.entries($uploadingItems) as [key, progress]}
                            <div class="space-y-1">
                                <div
                                    class="flex items-center justify-between text-sm"
                                >
                                    <span class="flex-1 truncate"
                                        >{$uploadingItemsNames[key] ||
                                            key}</span
                                    >
                                    <span class="text-muted-foreground text-xs">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                                <Progress value={progress} class="h-1.5" />
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}
