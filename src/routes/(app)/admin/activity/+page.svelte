<script lang="ts">
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		ShieldCheckIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import ActivityLog from "$lib/components/activity-log.svelte";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { cn } from "$lib/utils";

	onMount(() => {
		title.set(m.title_admin_activity());
	});

	const { data } = $props();
</script>

<div class="flex flex-col gap-5">
    <div
        class="text-muted-foreground bg-muted/50 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
    >
        <ShieldCheckIcon class="mt-px size-3.5 shrink-0" />
        <span>{m.admin_activity_privacy_note()}</span>
    </div>

    <ActivityLog
        entries={data.entries}
        showUser
        empty={m.admin_activity_empty()}
    />

    {#if data.pageCount > 1}
        <div class="flex items-center justify-between gap-3">
            <a
                class={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    data.page <= 1 && "pointer-events-none opacity-50",
                )}
                href="?page={data.page - 1}"
                aria-disabled={data.page <= 1}
            >
                <ChevronLeftIcon class="size-4" />
                {m.previous()}
            </a>
            <span class="text-muted-foreground text-xs tabular-nums">
                {m.page_of({
                    page: String(data.page),
                    total: String(data.pageCount),
                })}
            </span>
            <a
                class={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    data.page >= data.pageCount &&
                        "pointer-events-none opacity-50",
                )}
                href="?page={data.page + 1}"
                aria-disabled={data.page >= data.pageCount}
            >
                {m.next()}
                <ChevronRightIcon class="size-4" />
            </a>
        </div>
    {/if}
</div>
