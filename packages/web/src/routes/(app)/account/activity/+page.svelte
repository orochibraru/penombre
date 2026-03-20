<script lang="ts">
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_account_activity());
    });

    const { data } = $props();
</script>

<div class="w-full">
    <h2 class="text-lg font-medium">{m.activity_log()}</h2>
    {#if !data.activity || data.activity?.length === 0}
        <p class="mt-3 text-sm text-muted-foreground">
            {m.no_recent_activity()}
        </p>
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
