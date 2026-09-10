<script lang="ts">
	import {
		ActivityIcon,
		FileIcon,
		HardDriveIcon,
		Share2Icon,
		Trash2Icon,
		UsersIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import StorageUsage from "$lib/components/storage-usage.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { readableFileSize } from "$lib/utils";

	onMount(() => {
		title.set(m.title_admin_dashboard());
	});

	const { data } = $props();
	const stats = $derived(data.stats);

	const tiles = $derived([
		{
			label: m.admin_stat_users(),
			value: String(stats.userCount),
			icon: UsersIcon,
		},
		{
			label: m.admin_stat_files(),
			value: stats.fileCount.toLocaleString(),
			icon: FileIcon,
		},
		{
			label: m.admin_stat_stored(),
			value: readableFileSize(stats.totalBytes),
			icon: HardDriveIcon,
		},
		{
			label: m.admin_stat_shares(),
			value: String(stats.shareCount),
			icon: Share2Icon,
		},
		{
			label: m.admin_stat_activity(),
			value: stats.activityCount.toLocaleString(),
			icon: ActivityIcon,
		},
	]);

	/** Share of the whole volume each user takes, for the inline bars. */
	const maxUserBytes = $derived(
		Math.max(1, ...stats.perUser.map((row) => row.bytes)),
	);
</script>

<div class="flex flex-col gap-6">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {#each tiles as tile (tile.label)}
            {@const Icon = tile.icon}
            <Card.Root
                class="hover:border-primary/40 gap-0 py-4 transition-colors"
            >
                <Card.Content class="px-4">
                    <div class="mb-2 flex items-center justify-between">
                        <span
                            class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
                        >
                            {tile.label}
                        </span>
                        <Icon class="text-muted-foreground/60 size-4" />
                    </div>
                    <p class="text-2xl font-semibold tracking-tight tabular-nums">
                        {tile.value}
                    </p>
                </Card.Content>
            </Card.Root>
        {/each}
    </div>

    <div class="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Card.Root>
            <Card.Header>
                <Card.Title>{m.storage_management()}</Card.Title>
                <Card.Description>
                    {m.admin_storage_description()}
                </Card.Description>
            </Card.Header>
            <Card.Content class="flex flex-col gap-4">
                <StorageUsage
                    used={stats.totalBytes}
                    total={stats.disk.total}
                    available={stats.disk.available}
                    usedLabel={m.storage_legend_all_users()}
                />
                {#if stats.trashedBytes > 0}
                    <div
                        class="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    >
                        <Trash2Icon class="size-3.5 shrink-0" />
                        {m.admin_trash_reclaimable({
                            size: readableFileSize(stats.trashedBytes),
                        })}
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>{m.admin_usage_per_user()}</Card.Title>
                <Card.Description>
                    {m.admin_usage_per_user_description()}
                </Card.Description>
            </Card.Header>
            <Card.Content class="flex flex-col gap-3">
                {#each stats.perUser as row (row.id)}
                    <div class="flex flex-col gap-1.5">
                        <div class="flex items-baseline justify-between gap-3">
                            <span class="truncate text-sm font-medium">
                                {row.name}
                            </span>
                            <span
                                class="text-muted-foreground shrink-0 text-xs tabular-nums"
                            >
                                {readableFileSize(row.bytes)}
                            </span>
                        </div>
                        <div
                            class="bg-muted h-1.5 w-full overflow-hidden rounded-lg"
                        >
                            <div
                                class="bg-primary h-full rounded-lg transition-[width] duration-500 ease-out"
                                style="width: {(row.bytes / maxUserBytes) * 100}%"
                            ></div>
                        </div>
                    </div>
                {:else}
                    <p class="text-muted-foreground text-sm">
                        {m.admin_no_users()}
                    </p>
                {/each}
            </Card.Content>
        </Card.Root>
    </div>
</div>
