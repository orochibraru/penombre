<script lang="ts">
	import {
		AlertTriangleIcon,
		CheckIcon,
		ChevronDownIcon,
		RotateCwIcon,
		XIcon,
	} from "@lucide/svelte";
	import { fly, slide } from "svelte/transition";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import {
		failedUploads,
		globalUploadProgress,
		preparingUpload,
		uploadedItems,
		uploadingItems,
		uploadingItemsNames,
		uploadStats,
	} from "#lib/store/upload.js";
	import { dismissFailed, retryUpload } from "#lib/upload/manager.js";
	import { cn, etaLabel } from "#lib/utils.js";

	let expanded = $state(false);

	const preparing = $derived($preparingUpload.active);
	const uploading = $derived($globalUploadProgress.isUploading);
	const failedCount = $derived($failedUploads.length);
	const doneCount = $derived(Object.keys($uploadedItems).length);
	const busy = $derived(preparing || uploading);
	const completed = $derived(!busy && doneCount > 0 && failedCount === 0);
	const visible = $derived(busy || doneCount > 0 || failedCount > 0);
	// A failure needs a decision, so its list is never hidden behind a click.
	const open = $derived(expanded || (!busy && failedCount > 0));

	// Bytes, not the mean of per-file percentages: finished files leave that
	// map, which made the overall figure jump backwards on every completion.
	const percent = $derived(
		$uploadStats.totalBytes > 0
			? Math.min(
					100,
					Math.round(
						($uploadStats.uploadedBytes / $uploadStats.totalBytes) * 100,
					),
				)
			: 0,
	);

	const RADIUS = 9;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	/**
	 * Still warns, but it is now a courtesy rather than a data-loss guard:
	 * the queue lives in IndexedDB and resumes on the next load.
	 */
	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (busy) {
			e.preventDefault();
		}
	}

	$effect(() => {
		if (!busy) {
			return;
		}
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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

	function dismiss() {
		expanded = false;
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
</script>

{#snippet ring()}
    <svg
        class="size-6 shrink-0 -rotate-90 text-primary"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <circle
            cx="12"
            cy="12"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            class="opacity-20"
        />
        <circle
            cx="12"
            cy="12"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray={CIRCUMFERENCE}
            stroke-dashoffset={preparing
                ? CIRCUMFERENCE * 0.75
                : CIRCUMFERENCE * (1 - percent / 100)}
            class={cn(
                "transition-[stroke-dashoffset] duration-500",
                preparing && "origin-center animate-spin",
            )}
        />
    </svg>
{/snippet}

{#snippet status()}
    {#if failedCount > 0 && !busy}
        <AlertTriangleIcon class="size-5 shrink-0 text-destructive" />
        <span class="truncate font-medium">
            {m.upload_failed_title()} · {m.items_count({
                count: String(failedCount),
            })}
        </span>
    {:else if completed}
        <CheckIcon class="size-5 shrink-0 text-primary" />
        <span class="truncate font-medium">
            {m.upload_complete()} · {m.items_count({
                count: String(doneCount),
            })}
        </span>
    {:else if preparing}
        {@render ring()}
        <span class="truncate font-medium">{m.preparing_upload()}</span>
    {:else}
        {@render ring()}
        <span class="font-medium tabular-nums">{percent}%</span>
        <span class="truncate text-muted-foreground">
            {m.files_progress({
                completed: String($uploadStats.completedFiles),
                total: String($uploadStats.totalFiles),
            })}{$uploadStats.eta > 0
                ? ` · ${etaLabel($uploadStats.eta)} ${m.left()}`
                : ""}
        </span>
    {/if}
{/snippet}

{#if visible}
    <div
        data-testid="upload-progress-indicator"
        transition:fly={{ y: 24, duration: 200 }}
        class={cn(
            "fixed right-4 z-50 w-[min(22rem,calc(100vw-2rem))] border bg-surface-base shadow-lg",
            "rounded-xl md:right-6",
            // Stacked above the music player like the selection bar, from the
            // `--player-height` it publishes: pinned to the corner this panel
            // covers the player's own buttons, which are then unclickable for
            // as long as an upload is listed.
            "bottom-[calc(5rem+var(--player-height,0px))]",
            "lg:bottom-[calc(1.25rem+var(--player-height,0px))]",
        )}
    >
        <div class="flex items-center gap-1 py-1.5 pr-1.5 pl-3">
            <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                aria-expanded={open}
                aria-label={open ? m.collapse() : m.expand()}
                onclick={() => (expanded = !open)}
            >
                {@render status()}
            </button>
            <Button
                variant="ghost"
                size="icon"
                class="size-7 shrink-0"
                aria-label={open ? m.collapse() : m.expand()}
                onclick={() => (expanded = !open)}
            >
                <ChevronDownIcon
                    class={cn("size-4 transition-transform", !open && "rotate-180")}
                />
            </Button>
            {#if !busy}
                <Button
                    variant="ghost"
                    size="icon"
                    class="size-7 shrink-0"
                    aria-label={m.dismiss()}
                    onclick={dismiss}
                >
                    <XIcon class="size-4" />
                </Button>
            {/if}
        </div>

        {#if open}
            <div
                transition:slide={{ duration: 180 }}
                class="max-h-72 overflow-y-auto border-t px-3 pt-2 pb-3"
            >
                {#if uploading && $uploadStats.speed > 0}
                    <p class="pb-2 text-xs text-muted-foreground tabular-nums">
                        {formatSpeed($uploadStats.speed)}
                    </p>
                {/if}
                <ul class="space-y-2.5 text-sm">
                    <!-- Kept until acted on: a transfer cut off by closing the
                         tab is recorded as failed, so it is still here next
                         time rather than having quietly vanished. -->
                    {#each $failedUploads as failure (failure.id)}
                        <li class="flex items-center gap-2">
                            <AlertTriangleIcon
                                class="size-4 shrink-0 text-destructive"
                            />
                            <div class="min-w-0 flex-1">
                                <p class="truncate">{failure.displayName}</p>
                                <p class="truncate text-xs text-muted-foreground">
                                    {failure.error === "interrupted"
                                        ? m.upload_failed_interrupted()
                                        : failure.error}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-7"
                                aria-label={m.upload_retry()}
                                onclick={() => void retryUpload(failure.id)}
                            >
                                <RotateCwIcon class="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                class="size-7"
                                aria-label={m.dismiss()}
                                onclick={() => void dismissFailed(failure.id)}
                            >
                                <XIcon class="size-3.5" />
                            </Button>
                        </li>
                    {/each}
                    {#each Object.entries($uploadingItems) as [key, progress] (key)}
                        <li>
                            <div class="flex items-center justify-between gap-2">
                                <span class="truncate">
                                    {$uploadingItemsNames[key] || key}
                                </span>
                                <span
                                    class="shrink-0 text-xs text-muted-foreground tabular-nums"
                                >
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div
                                class="mt-1 h-0.5 overflow-hidden bg-primary/15"
                            >
                                <div
                                    class="h-full bg-primary transition-[width] duration-300"
                                    style="width: {progress}%"
                                ></div>
                            </div>
                        </li>
                    {/each}
                    {#each Object.entries($uploadedItems) as [key, item] (key)}
                        <li class="flex items-center gap-2 text-muted-foreground">
                            <CheckIcon class="size-4 shrink-0 text-primary" />
                            <span class="truncate">
                                {item.metadata.name || key}
                            </span>
                        </li>
                    {/each}
                    {#if preparing && $preparingUpload.status}
                        <li class="text-xs text-muted-foreground">
                            {$preparingUpload.status}
                        </li>
                    {/if}
                </ul>
            </div>
        {/if}
    </div>
{/if}
