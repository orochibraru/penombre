<script lang="ts">
    import { ScrollTextIcon } from "@lucide/svelte";
    import { onMount } from "svelte";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as m from "$lib/paraglide/messages.js";
    import { title } from "$lib/store/title";
    import { cn } from "$lib/utils";

    onMount(() => {
        title.set(m.title_account_activity());
    });

    const { data } = $props();

    /**
     * Log lines, not cards: this is a chronological stream, so it reads better
     * as dense fixed-width rows than as a stack of boxes. The action column is
     * padded to a fixed width so the messages align down the page.
     */
    const actionColour: Record<string, string> = {
        create: "text-emerald-600 dark:text-emerald-400",
        update: "text-sky-600 dark:text-sky-400",
        delete: "text-destructive",
        rename: "text-amber-600 dark:text-amber-400",
        share: "text-violet-600 dark:text-violet-400",
    };

    const levelColour: Record<string, string> = {
        warning: "text-amber-600 dark:text-amber-400",
        error: "text-destructive",
    };

    const stamp = (iso: string) =>
        new Date(iso).toLocaleString(undefined, {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
</script>

<div class="flex flex-col gap-3">
    {#if !data.activity || data.activity.length === 0}
        <Card.Root class="border-dashed shadow-none">
            <Card.Content
                class="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center"
            >
                <ScrollTextIcon class="size-5" />
                <p class="text-sm">{m.no_recent_activity()}</p>
            </Card.Content>
        </Card.Root>
    {:else}
        <Card.Root class="gap-0 overflow-hidden py-0">
            <ul
                class="divide-border/60 bg-muted/20 divide-y overflow-x-auto font-mono text-xs"
            >
                {#each data.activity as item (item.id)}
                    <li
                        class="hover:bg-muted/40 flex items-baseline gap-3 px-3 py-1.5 transition-colors"
                    >
                        <span
                            class="text-muted-foreground shrink-0 tabular-nums"
                        >
                            {stamp(item.createdAt)}
                        </span>
                        <span
                            class={cn(
                                "w-14 shrink-0 font-medium uppercase",
                                actionColour[item.action] ??
                                    "text-muted-foreground",
                            )}
                        >
                            {item.action}
                        </span>
                        <span
                            class={cn(
                                "min-w-0 flex-1 break-all",
                                levelColour[item.level],
                            )}
                        >
                            {item.message}
                        </span>
                    </li>
                {/each}
            </ul>
        </Card.Root>
    {/if}
</div>
