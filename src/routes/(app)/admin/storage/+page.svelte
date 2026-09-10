<script lang="ts">
	import { onMount } from "svelte";
	import StorageUsage from "$lib/components/storage-usage.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { readableFileSize } from "$lib/utils";

	onMount(() => {
		title.set(m.title_admin_storage());
	});

	const { data } = $props();
	const stats = $derived(data.stats);

	const rows = $derived([
		{ label: m.admin_stat_files(), value: stats.fileCount.toLocaleString() },
		{
			label: m.admin_stat_stored(),
			value: readableFileSize(stats.totalBytes),
		},
		{ label: m.nav_trash(), value: readableFileSize(stats.trashedBytes) },
	]);

	const maxUserBytes = $derived(
		Math.max(1, ...stats.perUser.map((row) => row.bytes)),
	);
</script>

<div class="grid items-start gap-4 xl:grid-cols-2">
    <Card.Root>
        <Card.Content class="flex flex-col gap-5">
            <StorageUsage
                used={stats.totalBytes}
                total={stats.disk.total}
                available={stats.disk.available}
                usedLabel={m.storage_legend_all_users()}
            />

            <dl class="divide-border divide-y border-t pt-1 text-sm">
                {#each rows as row (row.label)}
                    <div class="flex items-center justify-between py-2">
                        <dt class="text-muted-foreground">{row.label}</dt>
                        <dd class="font-medium tabular-nums">{row.value}</dd>
                    </div>
                {/each}
                <div class="flex items-center justify-between gap-3 py-2">
                    <dt class="text-muted-foreground shrink-0">
                        {m.admin_storage_path()}
                    </dt>
                    <dd
                        class="bg-muted/60 truncate rounded px-1.5 py-0.5 font-mono text-xs"
                        title={data.storagePath}
                    >
                        {data.storagePath}
                    </dd>
                </div>
            </dl>
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
                        <div class="min-w-0">
                            <span class="truncate text-sm font-medium">
                                {row.name}
                            </span>
                            <span class="text-muted-foreground ml-2 text-xs">
                                {row.email}
                            </span>
                        </div>
                        <span
                            class="text-muted-foreground shrink-0 text-xs tabular-nums"
                        >
                            {row.fileCount} · {readableFileSize(row.bytes)}
                        </span>
                    </div>
                    <div
                        class="bg-muted h-1.5 w-full overflow-hidden rounded-xs"
                    >
                        <div
                            class="bg-primary h-full rounded-xs transition-[width] duration-500 ease-out"
                            style="width: {(row.bytes / maxUserBytes) * 100}%"
                        ></div>
                    </div>
                </div>
            {:else}
                <p class="text-muted-foreground text-sm">{m.admin_no_users()}</p>
            {/each}
        </Card.Content>
    </Card.Root>
</div>
