<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { cn } from "$lib/utils";

	/**
	 * Activity rendered as log lines rather than cards.
	 *
	 * Both the account and admin views use this so the two stay identical —
	 * they differ only in whether the acting user is shown. The action column
	 * is a fixed width so messages align down the page.
	 */
	interface Entry {
		id: string;
		createdAt: string;
		action: string;
		level: string;
		message: string;
		userName?: string | null;
	}

	let {
		entries,
		showUser = false,
		empty,
	}: { entries: Entry[]; showUser?: boolean; empty: string } = $props();

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

<Card.Root class="gap-0 overflow-hidden py-0">
    {#if entries.length === 0}
        <p class="text-muted-foreground py-12 text-center text-sm">{empty}</p>
    {:else}
        <ul
            class="divide-border/60 bg-muted/20 divide-y overflow-x-auto font-mono text-xs"
        >
            {#each entries as item (item.id)}
                <li
                    class="hover:bg-muted/40 flex items-baseline gap-3 px-3 py-1.5 transition-colors"
                >
                    <span class="text-muted-foreground shrink-0 tabular-nums">
                        {stamp(item.createdAt)}
                    </span>
                    {#if showUser}
                        <span class="w-40 shrink-0 truncate">
                            {item.userName ?? m.admin_activity_deleted_user()}
                        </span>
                    {/if}
                    <span
                        class={cn(
                            "w-14 shrink-0 font-medium uppercase",
                            actionColour[item.action] ?? "text-muted-foreground",
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
    {/if}
</Card.Root>
