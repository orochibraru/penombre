<script lang="ts">
	import { FolderIcon, XIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { draggedFolder } from "#lib/store/shortcuts.js";
	import { cn } from "#lib/utils.js";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";

	interface Shortcut {
		folderId: string;
		name: string;
		href: string;
	}

	let { shortcuts }: { shortcuts: Shortcut[] } = $props();

	// Reordered in place while dragging, reset by every load.
	let items = $derived(shortcuts);
	/** The shortcut being dragged to a new place. */
	let moving: string | null = $state(null);
	let over = $state(false);

	const accepts = $derived($draggedFolder !== null || moving !== null);

	function isActive(href: string) {
		return (
			page.url.pathname === href || page.url.pathname.startsWith(`${href}/`)
		);
	}

	function onGroupDragOver(e: DragEvent) {
		if (!accepts) {
			return;
		}
		e.preventDefault();
		over = true;
	}

	async function onGroupDrop(e: DragEvent) {
		const folder = $draggedFolder;
		over = false;
		if (moving) {
			e.preventDefault();
			const order = items.map((item) => item.folderId);
			moving = null;
			const { error } = await api.PUT("/api/v1/shortcuts", {
				body: { folderIds: order },
			});
			if (error) {
				toast.error(m.toast_shortcut_error());
			}
			await invalidate("app:shortcuts");
			return;
		}
		if (!folder) {
			return;
		}
		e.preventDefault();
		const { error } = await api.POST("/api/v1/shortcuts", {
			body: { folderId: folder.id },
		});
		if (error) {
			toast.error(m.toast_shortcut_error());
			return;
		}
		toast.success(m.toast_shortcut_added({ name: folder.name }));
		await invalidate("app:shortcuts");
	}

	function onItemDragOver(target: string) {
		if (!moving || moving === target) {
			return;
		}
		const from = items.findIndex((item) => item.folderId === moving);
		const to = items.findIndex((item) => item.folderId === target);
		const next = [...items];
		const [dragged] = next.splice(from, 1);
		if (dragged) {
			next.splice(to, 0, dragged);
			items = next;
		}
	}

	async function remove(folderId: string) {
		items = items.filter((item) => item.folderId !== folderId);
		const { error } = await api.DELETE("/api/v1/shortcuts/{folderId}", {
			params: { path: { folderId } },
		});
		if (error) {
			toast.error(m.toast_shortcut_error());
		}
		await invalidate("app:shortcuts");
	}
</script>

<svelte:window ondragend={() => draggedFolder.set(null)} />

{#if items.length > 0 || $draggedFolder}
    <Sidebar.Group
        class={cn("rounded-lg transition-colors", over && "bg-primary/10 ring-2 ring-primary")}
        ondragover={onGroupDragOver}
        ondragleave={() => (over = false)}
        ondrop={onGroupDrop}
    >
        <Sidebar.GroupLabel>{m.nav_shortcuts()}</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
            <Sidebar.Menu>
                {#each items as item (item.folderId)}
                    <Sidebar.MenuItem
                        draggable="true"
                        class={cn(moving === item.folderId && "opacity-50")}
                        ondragstart={(e: DragEvent) => {
                            moving = item.folderId;
                            if (e.dataTransfer) {
                                e.dataTransfer.effectAllowed = "move";
                            }
                        }}
                        ondragend={() => (moving = null)}
                        ondragover={() => onItemDragOver(item.folderId)}
                    >
                        <Sidebar.MenuButton isActive={isActive(item.href)}>
                            {#snippet child({ props })}
                                <a
                                    href={item.href}
                                    {...props}
                                    class={cn(props.class as string, "text-sm font-medium")}
                                    title={item.name}
                                >
                                    <FolderIcon class="text-primary md:h-4.5 md:w-4.5" />
                                    <span>{item.name}</span>
                                </a>
                            {/snippet}
                        </Sidebar.MenuButton>
                        <Sidebar.MenuAction
                            showOnHover
                            aria-label={m.shortcut_remove({ name: item.name })}
                            title={m.shortcut_remove({ name: item.name })}
                            onclick={() => remove(item.folderId)}
                        >
                            <XIcon />
                        </Sidebar.MenuAction>
                    </Sidebar.MenuItem>
                {/each}
                {#if items.length === 0}
                    <li class="px-2 py-1.5 text-xs text-muted-foreground">
                        {m.shortcuts_drop_hint()}
                    </li>
                {/if}
            </Sidebar.Menu>
        </Sidebar.GroupContent>
    </Sidebar.Group>
{/if}
