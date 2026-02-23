<script lang="ts">
    import {
        CheckIcon,
        ChevronDownIcon,
        ChevronUpIcon,
        MinimizeIcon,
        XIcon,
    } from "@lucide/svelte";
    import { fly, slide } from "svelte/transition";
    import { beforeNavigate } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Progress } from "$lib/components/ui/progress";
    import { cn } from "$lib/utils";
    import {
        globalUploadProgress,
        preparingUpload,
        uploadedItems,
        uploadingItems,
        uploadingItemsNames,
        uploadStats,
    } from "$lib/store/upload";
    import Spinner from "$lib/components/ui/Spinner.svelte";

    let expanded = $state(true);
    let isUploading = $derived(
        $preparingUpload.active || $globalUploadProgress.isUploading,
    );
    let isCompleted = $derived(
        !$globalUploadProgress.isUploading &&
            Object.keys($uploadedItems).length > 0,
    );

    // Warn user before leaving/reloading when uploads are in progress
    function handleBeforeUnload(e: BeforeUnloadEvent) {
        if (isUploading) {
            e.preventDefault();
        }
    }

    $effect(() => {
        if (isUploading) {
            window.addEventListener("beforeunload", handleBeforeUnload);
        } else {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        }

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    });

    // Block SvelteKit client-side navigation while uploading
    beforeNavigate(({ cancel }) => {
        if (isUploading) {
            const confirmed = window.confirm(
                "Files are still uploading. Leaving this page will cancel all in-progress uploads. Are you sure?",
            );
            if (!confirmed) {
                cancel();
            }
        }
    });

    function formatSpeed(bytesPerSec: number): string {
        if (bytesPerSec >= 1024 * 1024) {
            return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
        }
        if (bytesPerSec >= 1024) {
            return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
        }
        return `${Math.round(bytesPerSec)} B/s`;
    }

    function formatEta(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return s > 0 ? `${m}m ${s}s` : `${m}m`;
        }
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }

    function dismiss() {
        uploadedItems.set({});
        uploadingItems.set({});
        uploadingItemsNames.set({});
        preparingUpload.set({ active: false, status: "" });
        uploadStats.set({
            totalFiles: 0,
            completedFiles: 0,
            totalBytes: 0,
            uploadedBytes: 0,
            startTime: 0,
            speed: 0,
            eta: 0,
        });
    }

    function toggleExpanded() {
        expanded = !expanded;
    }
</script>

{#if $preparingUpload.active || $globalUploadProgress.isUploading || isCompleted}
    <div
        data-testid="upload-progress-indicator"
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
                {:else if $preparingUpload.active}
                    <span class="font-medium flex items-center gap-2">
                        Preparing upload <Spinner />
                    </span>
                {:else}
                    <span class="font-medium flex items-center gap-2">
                        Uploading <Spinner />
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
                {:else if $preparingUpload.active}
                    <div class="flex items-center gap-3 py-2">
                        <span class="text-sm text-muted-foreground">
                            {$preparingUpload.status}
                        </span>
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
                        <div
                            class="mt-1.5 flex items-center justify-between text-xs text-muted-foreground"
                        >
                            <span>
                                {$uploadStats.completedFiles} of {$uploadStats.totalFiles}
                                files
                            </span>
                            <span>
                                {#if $uploadStats.speed > 0}
                                    {formatSpeed($uploadStats.speed)}
                                    {#if $uploadStats.eta > 0}
                                        &middot; {formatEta($uploadStats.eta)} left
                                    {/if}
                                {/if}
                            </span>
                        </div>
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
