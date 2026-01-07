<script lang="ts">
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Account - Activity");
    });

    const { data } = $props();
</script>

<div class="w-full">
    <h2 class="text-lg font-medium">Activity Log</h2>
    {#if !data.activity || data.activity?.length === 0}
        <p class="mt-3 text-sm text-muted-foreground">No recent activity.</p>
    {:else}
        <ul class="mt-3 space-y-2">
            {#each data.activity as item}
                <li class="rounded-md border p-3">
                    <div class="flex justify-between">
                        <Badge>{item.action}</Badge>
                        <p class="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <p class="text-sm text-muted-foreground">
                        {item.message}
                    </p>
                </li>
            {/each}
        </ul>
    {/if}
</div>
