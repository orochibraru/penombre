<script lang="ts">
	import {
		AlertCircleIcon,
		CheckIcon,
		ChevronDownIcon,
		EyeIcon,
		LoaderIcon,
		MessageSquareDiffIcon,
		MessageSquareIcon,
		PencilIcon,
	} from "@lucide/svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import * as Tooltip from "#lib/components/ui/tooltip/index.js";
	import { baseName } from "#lib/documents.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import type { EditorMode, SaveStatus } from "./file-actions.js";
	import type { Present } from "./presence.svelte.js";
	import PresenceFaces from "./presence-faces.svelte";

	/**
	 * The editor's header: the file's name (click to rename), how saving is
	 * going, who else is here, the comments and the view/edit switch. One
	 * row that wraps, condensed to icons on a phone.
	 */
	const {
		name,
		showName = true,
		touch = false,
		canWrite,
		trackedChanges = false,
		suggest = false,
		mode,
		onmode,
		status,
		people,
		comments,
		onrename,
	}: {
		name: string;
		/** False where a native header around the page already shows it. */
		showName?: boolean;
		/** Finger-sized buttons: the mobile app's editor screen. */
		touch?: boolean;
		canWrite: boolean;
		trackedChanges?: boolean;
		/** Offer Suggesting beside Viewing and Editing. */
		suggest?: boolean;
		mode: EditorMode;
		onmode: (mode: EditorMode) => void;
		status: SaveStatus;
		people: Present[];
		/** Open threads and the panel's toggle; no button without it. */
		comments?: { count: number; open: boolean; toggle: () => void };
		onrename: (title: string) => Promise<boolean>;
	} = $props();

	let renaming = $state(false);

	const viewing = $derived({
		value: "view" as const,
		icon: EyeIcon,
		label: m.shell_viewing(),
		hint: m.shell_viewing_hint(),
	});
	const modes = $derived([
		viewing,
		{
			value: "edit" as const,
			icon: PencilIcon,
			label: m.shell_editing(),
			hint: m.shell_editing_hint(),
		},
		...(suggest
			? [
					{
						value: "suggest" as const,
						icon: MessageSquareDiffIcon,
						label: m.shell_suggesting(),
						hint: m.shell_suggesting_hint(),
					},
				]
			: []),
	]);
	const current = $derived(
		modes.find((choice) => choice.value === mode) ?? viewing,
	);

	async function commitRename(input: HTMLInputElement) {
		if (!renaming) {
			return;
		}
		renaming = false;
		const title = input.value.trim();
		if (title && title !== baseName(name)) {
			await onrename(title);
		}
	}

	function focusName(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
    <div class="flex min-w-0 flex-1 items-center gap-2">
        {#if showName && renaming}
            <input
                use:focusName
                class="border-input focus-visible:ring-ring h-8 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-base font-medium outline-none focus-visible:ring-2 md:text-lg"
                aria-label={m.shell_rename_label()}
                value={baseName(name)}
                onkeydown={(e) => {
                    if (e.key === "Enter") {
                        void commitRename(e.currentTarget);
                    } else if (e.key === "Escape") {
                        renaming = false;
                    }
                }}
                onblur={(e) => void commitRename(e.currentTarget)}
            />
        {:else if showName && canWrite}
            <h1 class="flex min-w-0 text-base font-medium md:text-lg">
                <button
                    type="button"
                    class="hover:bg-muted min-w-0 truncate rounded-md px-1 text-start"
                    title={m.shell_rename_hint()}
                    onclick={() => (renaming = true)}
                >
                    {name}
                </button>
            </h1>
        {:else if showName}
            <h1 class="min-w-0 truncate px-1 text-base font-medium md:text-lg">{name}</h1>
        {/if}
        <span
            class="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs tabular-nums"
            aria-live="polite"
        >
            {#if status.saving}
                <LoaderIcon class="size-3.5 animate-spin" />
                <span class="hidden sm:inline">{m.editor_saving()}</span>
            {:else if status.failed}
                <AlertCircleIcon class="text-destructive size-3.5" />
                <span class="hidden sm:inline">{m.editor_save_error()}</span>
            {:else if status.pending}
                <span class="hidden sm:inline">{m.editor_unsaved()}</span>
            {:else if status.savedAt}
                <CheckIcon class="size-3.5" />
                <span class="hidden sm:inline">
                    {m.editor_saved({ time: status.savedAt.toLocaleTimeString() })}
                </span>
            {/if}
        </span>
    </div>

    <div class="flex items-center gap-2">
        <PresenceFaces {people} />
        {#if comments}
            <Button
                variant={comments.open ? "secondary" : "ghost"}
                size="sm"
                class={cn("gap-1.5", touch && "h-10 min-w-10")}
                aria-label={m.shell_comments()}
                aria-pressed={comments.open}
                onclick={comments.toggle}
            >
                <MessageSquareIcon class="size-4" />
                {#if comments.count > 0}
                    <span class="tabular-nums">{comments.count}</span>
                {/if}
            </Button>
        {/if}
        {#if canWrite}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    {#snippet child({ props })}
                        <Button
                            {...props}
                            variant="outline"
                            size="sm"
                            class={cn("gap-1.5", touch && "h-10 min-w-10")}
                            aria-label={`${m.shell_mode()}: ${current.label}`}
                        >
                            <current.icon class="text-primary size-4" />
                            <span class="hidden sm:inline">{current.label}</span>
                            <ChevronDownIcon class="text-muted-foreground size-3.5" />
                        </Button>
                    {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="w-72">
                    {#each modes as choice (choice.value)}
                        <DropdownMenu.Item
                            class="items-start gap-3 py-2"
                            onSelect={() => onmode(choice.value)}
                        >
                            <choice.icon class="text-primary mt-0.5 size-4" />
                            <span class="flex min-w-0 flex-1 flex-col">
                                <span class="font-medium">{choice.label}</span>
                                <span class="text-muted-foreground text-xs">{choice.hint}</span>
                            </span>
                            {#if choice.value === mode}
                                <CheckIcon class="text-primary mt-0.5 size-4" />
                            {/if}
                        </DropdownMenu.Item>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        {:else}
            <Tooltip.Root>
                <Tooltip.Trigger>
                    {#snippet child({ props })}
                        <Badge {...props} variant="secondary" class="gap-1">
                            <EyeIcon />
                            {trackedChanges
                                ? m.shell_tracked_changes()
                                : m.shell_view_only()}
                        </Badge>
                    {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>
                    {trackedChanges
                        ? m.shell_tracked_changes_hint()
                        : m.shell_view_only_hint()}
                </Tooltip.Content>
            </Tooltip.Root>
        {/if}
    </div>
</div>
