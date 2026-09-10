<script lang="ts">
	import { SparklesIcon, Trash2Icon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import FileTypeIcon from "$lib/components/file-type-icon.svelte";
	import StorageUsage from "$lib/components/storage-usage.svelte";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import {
		filesCountLabel,
		readableFileSize,
		trashHoldsLabel,
	} from "$lib/utils";

	onMount(() => {
		title.set(m.title_settings_storage());
	});

	const { data } = $props();
	const stats = $derived(data.stats);

	/** Bars are relative to the biggest category, not the disk — otherwise
	 *  every bar on a large volume renders as an invisible sliver. */
	const maxCategoryBytes = $derived(
		Math.max(1, ...stats.byCategory.map((row) => row.bytes)),
	);
	const maxFileBytes = $derived(
		Math.max(1, ...stats.largestFiles.map((file) => file.size)),
	);
</script>

<div class="grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
    <Card.Root>
        <Card.Content>
            <StorageUsage
                used={stats.used}
                total={stats.disk.total}
                available={stats.disk.available}
            />
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.storage_by_category()}</Card.Title>
            <Card.Description>
                {filesCountLabel(
                    stats.fileCount,
                    readableFileSize(stats.used),
                )}
            </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
            {#each stats.byCategory as row (row.category)}
                <div class="flex items-center gap-3">
                    <FileTypeIcon
                        category={row.category}
                        class="text-muted-foreground size-4 shrink-0"
                    />
                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                        <div class="flex items-baseline justify-between gap-3">
                            <span class="truncate text-sm capitalize">
                                {row.category.toLowerCase()}
                            </span>
                            <span
                                class="text-muted-foreground shrink-0 text-xs tabular-nums"
                            >
                                {row.count} · {readableFileSize(row.bytes)}
                            </span>
                        </div>
                        <div
                            class="bg-muted h-1.5 w-full overflow-hidden rounded-xs"
                        >
                            <div
                                class="bg-primary h-full rounded-xs transition-[width] duration-500 ease-out"
                                style="width: {(row.bytes / maxCategoryBytes) *
                                    100}%"
                            ></div>
                        </div>
                    </div>
                </div>
            {:else}
                <div
                    class="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center"
                >
                    <SparklesIcon class="size-6 opacity-50" />
                    <p class="text-sm">{m.storage_no_files()}</p>
                </div>
            {/each}
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.storage_cleanup()}</Card.Title>
            <Card.Description>
                {m.storage_cleanup_description()}
            </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-5">
            <div
                class="bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-xs px-3 py-2.5"
            >
                <span class="flex items-center gap-2 text-sm">
                    <Trash2Icon class="text-muted-foreground size-4 shrink-0" />
                    {trashHoldsLabel(
                        stats.trashedCount,
                        readableFileSize(stats.trashedBytes),
                    )}
                </span>
                <a
                    class={buttonVariants({ variant: "outline", size: "sm" })}
                    href={resolve("/trash")}
                >
                    {m.storage_review_trash()}
                </a>
            </div>

            {#if stats.largestFiles.length > 0}
                <div class="flex flex-col gap-2">
                    <p class="text-sm font-medium">
                        {m.storage_largest_files()}
                    </p>
                    {#each stats.largestFiles as file (file.id)}
                        <div class="flex flex-col gap-1">
                            <div
                                class="flex items-baseline justify-between gap-3"
                            >
                                <span class="truncate text-sm">
                                    {file.name}
                                </span>
                                <span
                                    class="text-muted-foreground shrink-0 text-xs tabular-nums"
                                >
                                    {readableFileSize(file.size)}
                                </span>
                            </div>
                            <div
                                class="bg-muted h-1 w-full overflow-hidden rounded-xs"
                            >
                                <div
                                    class="bg-primary/50 h-full rounded-xs"
                                    style="width: {(file.size / maxFileBytes) *
                                        100}%"
                                ></div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
