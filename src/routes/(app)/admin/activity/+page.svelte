<script lang="ts">
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		ShieldCheckIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import Badge, {
		type BadgeVariant,
	} from "$lib/components/ui/badge/badge.svelte";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { cn } from "$lib/utils";

	onMount(() => {
		title.set(m.title_admin_activity());
	});

	const { data } = $props();

	// Tinted rather than solid: a log page is mostly for scanning, and a
	// column of filled red badges reads as an incident when it is just history.
	const levelVariant: Record<string, BadgeVariant> = {
		info: "secondary",
		warning: "outline",
		error: "outline",
	};

	const levelClass: Record<string, string> = {
		warning:
			"border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
		error:
			"border-destructive/40 bg-destructive/10 text-destructive dark:text-red-400",
	};

	const initials = (name: string | null) =>
		(name ?? "?")
			.split(" ")
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("");
</script>

<div class="flex flex-col gap-5">
    <div
        class="text-muted-foreground bg-muted/50 flex items-start gap-2 rounded-xs px-3 py-2.5 text-xs"
    >
        <ShieldCheckIcon class="mt-px size-3.5 shrink-0" />
        <span>{m.admin_activity_privacy_note()}</span>
    </div>

    <Card.Root class="gap-0 overflow-hidden py-0">
        <Table.Root>
            <Table.Header>
                <Table.Row class="hover:bg-transparent">
                    <Table.Head>{m.admin_activity_when()}</Table.Head>
                    <Table.Head>{m.admin_activity_who()}</Table.Head>
                    <Table.Head>{m.admin_activity_action()}</Table.Head>
                    <Table.Head class="text-right">
                        {m.admin_activity_level()}
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each data.entries as entry (entry.id)}
                    <Table.Row>
                        <Table.Cell
                            class="text-muted-foreground whitespace-nowrap tabular-nums"
                        >
                            {new Date(entry.createdAt).toLocaleString()}
                        </Table.Cell>
                        <Table.Cell>
                            <div class="flex items-center gap-2">
                                <span
                                    class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-xs text-[10px] font-medium"
                                    aria-hidden="true"
                                >
                                    {initials(entry.userName)}
                                </span>
                                <span class="truncate">
                                    {entry.userName ??
                                        m.admin_activity_deleted_user()}
                                </span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="capitalize">
                            {entry.action}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                            <Badge
                                variant={levelVariant[entry.level] ??
                                    "secondary"}
                                class={cn(levelClass[entry.level])}
                            >
                                {entry.level}
                            </Badge>
                        </Table.Cell>
                    </Table.Row>
                {:else}
                    <Table.Row class="hover:bg-transparent">
                        <Table.Cell
                            colspan={4}
                            class="text-muted-foreground py-12 text-center"
                        >
                            {m.admin_activity_empty()}
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </Card.Root>

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
