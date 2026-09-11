<script lang="ts">
	import {
		AlertTriangleIcon,
		CheckIcon,
		ChevronDownIcon,
		ChevronUpIcon,
		RotateCwIcon,
		XIcon,
	} from "@lucide/svelte";
	import { fly, slide } from "svelte/transition";
	import { Button } from "$lib/components/ui/button";
	import { Progress } from "$lib/components/ui/progress";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import {
		failedUploads,
		globalUploadProgress,
		preparingUpload,
		uploadedItems,
		uploadingItems,
		uploadingItemsNames,
		uploadStats,
	} from "$lib/store/upload";
	import { dismissFailed, retryUpload } from "$lib/upload/manager";
	import { cn } from "$lib/utils";

	let expanded = $state(true);
	let isUploading = $derived(
		$preparingUpload.active || $globalUploadProgress.isUploading,
	);
	let isCompleted = $derived(
		!$globalUploadProgress.isUploading &&
			Object.keys($uploadedItems).length > 0,
	);

	/**
	 * Still warns, but it is now a courtesy rather than a data-loss guard:
	 * the queue lives in IndexedDB and resumes on the next load.
	 */
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

	// No guard on client-side navigation any more: the transfer lives in a
	// worker owned by the layout, so moving between pages does not touch it.

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
		if (seconds < 60) {
			return `${seconds}s`;
		}
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
		failedUploads.set([]);
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

{#if $preparingUpload.active || $globalUploadProgress.isUploading || isCompleted || $failedUploads.length > 0}
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
                {#if $failedUploads.length > 0 && !$globalUploadProgress.isUploading && !$preparingUpload.active}
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="text-destructive size-5" />
                        <div>
                            <p class="font-medium">{m.upload_failed_title()}</p>
                            <p class="text-sm">
                                {m.items_count({
                                    count: String($failedUploads.length),
                                })}
                            </p>
                        </div>
                    </div>
                {:else if isCompleted}
                    <div class="flex items-center gap-2">
                        <CheckIcon class="size-5 text-green-600" />
                        <div>
                            <p class="font-medium">{m.upload_complete()}</p>
                            <p class="text-sm">
                                {m.items_count({
                                    count: String(
                                        Object.keys($uploadedItems).length,
                                    ),
                                })}
                            </p>
                        </div>
                    </div>
                {:else if $preparingUpload.active}
                    <span class="font-medium flex items-center gap-2">
                        {m.preparing_upload()}
                        <Spinner />
                    </span>
                {:else}
                    <span class="font-medium flex items-center gap-2">
                        {m.uploading()}
                        <Spinner />
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
                {#if $failedUploads.length > 0}
                    <!-- Kept until acted on: a transfer cut off by closing the
                         tab is recorded as failed, so it is still here next
                         time rather than having quietly vanished. -->
                    <div class="mb-3 space-y-2">
                        {#each $failedUploads as failure (failure.id)}
                            <div
                                class="border-destructive/40 bg-destructive/5 flex items-center gap-2 rounded-md border p-2 text-sm"
                            >
                                <AlertTriangleIcon
                                    class="text-destructive size-4 shrink-0"
                                />
                                <div class="min-w-0 flex-1">
                                    <p class="truncate">
                                        {failure.displayName}
                                    </p>
                                    <p
                                        class="text-muted-foreground truncate text-xs"
                                    >
                                        {failure.error === "interrupted"
                                            ? m.upload_failed_interrupted()
                                            : failure.error}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-7 px-2"
                                    title={m.upload_retry()}
                                    onclick={() => void retryUpload(failure.id)}
                                >
                                    <RotateCwIcon class="size-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-7 px-2"
                                    onclick={() => void dismissFailed(failure.id)}
                                >
                                    <XIcon class="size-3.5" />
                                </Button>
                            </div>
                        {/each}
                    </div>
                {/if}
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
                                {m.overall_progress()}
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
                                {m.files_progress({
                                    completed: String(
                                        $uploadStats.completedFiles,
                                    ),
                                    total: String($uploadStats.totalFiles),
                                })}
                            </span>
                            <span>
                                {#if $uploadStats.speed > 0}
                                    {formatSpeed($uploadStats.speed)}
                                    {#if $uploadStats.eta > 0}
                                        &middot; {formatEta($uploadStats.eta)}
                                        {m.left()}
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
