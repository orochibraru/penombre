<script lang="ts">
	import { BellIcon, MessageSquareIcon, Share2Icon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { api } from "$lib/api";
	import { Button, buttonVariants } from "$lib/components/ui/button/index";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
	import { m } from "$lib/paraglide/messages.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The bell.
	 *
	 * Loads once on mount and re-polls on an interval — there is no push
	 * channel, and adding one would mean a pub/sub the single-container
	 * install does not otherwise need. A minute is slow enough to be free and
	 * fast enough that a note left while you sit on a page still arrives.
	 */
	interface Item {
		id: string;
		type: "note" | "share";
		actorName: string | null;
		resourceName: string | null;
		link: string | null;
		read: boolean;
		createdAt: string;
	}

	const POLL_MS = 60_000;

	let items: Item[] = $state([]);
	let unread = $state(0);
	let open = $state(false);

	const icon = { note: MessageSquareIcon, share: Share2Icon };

	/**
	 * Rendered here rather than stored as a sentence, so the row reads in the
	 * locale of whoever opens the bell — not the one the actor happened to be
	 * using when they wrote it.
	 */
	function label(item: Item): string {
		const other = item.resourceName ?? "";
		if (item.type === "note") {
			return item.actorName
				? m.notification_note({ actor: item.actorName, item: other })
				: m.notification_note_generic({ item: other });
		}
		return item.actorName
			? m.notification_share({ actor: item.actorName, item: other })
			: m.notification_share_generic({ item: other });
	}

	const stamp = (iso: string) =>
		new Date(iso).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	async function load() {
		const { data } = await api.GET("/api/v1/notifications", {});
		const payload = data?.data;
		if (payload) {
			items = payload.notifications as Item[];
			unread = payload.unread;
		}
	}

	async function markRead(ids?: string[]) {
		const { data } = await api.POST("/api/v1/notifications/read", {
			body: ids ? { ids } : {},
		});
		if (data?.data) {
			unread = data.data.unread;
			const cleared = new Set(ids);
			items = items.map((item) =>
				!ids || cleared.has(item.id) ? { ...item, read: true } : item,
			);
		}
	}

	async function activate(item: Item) {
		open = false;
		if (!item.read) {
			await markRead([item.id]);
		}
		if (item.link) {
			await goto(item.link);
		}
	}

	onMount(() => {
		void load();
		const timer = setInterval(() => void load(), POLL_MS);
		return () => clearInterval(timer);
	});
</script>

<DropdownMenu.Root bind:open>
    <DropdownMenu.Trigger
        class={cn(buttonVariants({ variant: "outline", size: "icon" }), "relative")}
        title={m.notifications_title()}
    >
        <BellIcon class="h-[1.2rem] w-[1.2rem]" />
        {#if unread > 0}
            <span
                class="bg-primary text-primary-foreground absolute -inset-e-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums"
            >
                {unread > 9 ? "9+" : unread}
            </span>
        {/if}
        <span class="sr-only">
            {unread === 1
                ? m.notifications_unread_one()
                : m.notifications_unread_other({ count: String(unread) })}
        </span>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-80 max-w-[calc(100vw-2rem)]">
        <div class="flex items-center justify-between gap-2 px-2 py-1.5">
            <span class="text-sm font-medium">{m.notifications_title()}</span>
            {#if unread > 0}
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-auto px-1.5 py-0.5 text-xs"
                    onclick={() => markRead()}
                >
                    {m.notifications_mark_all_read()}
                </Button>
            {/if}
        </div>
        <DropdownMenu.Separator />
        {#if items.length === 0}
            <p class="text-muted-foreground px-2 py-6 text-center text-sm">
                {m.notifications_empty()}
            </p>
        {:else}
            <div class="max-h-80 overflow-y-auto">
                {#each items as item (item.id)}
                    {@const Icon = icon[item.type]}
                    <DropdownMenu.Item
                        class="items-start gap-2"
                        onSelect={() => activate(item)}
                    >
                        <Icon
                            class={cn(
                                "mt-0.5 size-4 shrink-0",
                                item.read
                                    ? "text-muted-foreground"
                                    : "text-primary",
                            )}
                        />
                        <div class="min-w-0 flex-1">
                            <p
                                class={cn(
                                    "text-sm wrap-anywhere",
                                    !item.read && "font-medium",
                                )}
                            >
                                {label(item)}
                            </p>
                            <p class="text-muted-foreground text-xs">
                                {stamp(item.createdAt)}
                            </p>
                        </div>
                    </DropdownMenu.Item>
                {/each}
            </div>
        {/if}
    </DropdownMenu.Content>
</DropdownMenu.Root>
