<script lang="ts">
	import {
		AlertCircleIcon,
		CheckIcon,
		EyeIcon,
		LoaderIcon,
		MessageSquareIcon,
		PencilIcon,
	} from "@lucide/svelte";
	import { Badge } from "#lib/components/ui/badge/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as ToggleGroup from "#lib/components/ui/toggle-group/index.js";
	import * as Tooltip from "#lib/components/ui/tooltip/index.js";
	import { baseName } from "#lib/documents.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { SaveStatus } from "./file-actions.js";
	import type { Present } from "./presence.svelte.js";
	import PresenceFaces from "./presence-faces.svelte";

	/**
	 * The editor's header: the file's name (click to rename), how saving is
	 * going, who else is here, the comments and the view/edit switch. One
	 * row that wraps, condensed to icons on a phone.
	 */
	const {
		name,
		canWrite,
		mode,
		onmode,
		status,
		people,
		comments,
		onrename,
	}: {
		name: string;
		canWrite: boolean;
		mode: "view" | "edit";
		onmode: (mode: "view" | "edit") => void;
		status: SaveStatus;
		people: Present[];
		/** Open threads and the panel's toggle; no button without it. */
		comments?: { count: number; open: boolean; toggle: () => void };
		onrename: (title: string) => Promise<boolean>;
	} = $props();

	let renaming = $state(false);

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
        {#if renaming}
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
        {:else if canWrite}
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
        {:else}
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
                class="gap-1.5"
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
            <ToggleGroup.Root
                type="single"
                variant="outline"
                size="sm"
                value={mode}
                onValueChange={(value) => {
                    if (value === "view" || value === "edit") {
                        onmode(value);
                    }
                }}
                aria-label={m.shell_mode()}
            >
                <ToggleGroup.Item value="view" aria-label={m.shell_viewing()}>
                    <EyeIcon class="size-4" />
                    <span class="hidden sm:inline">{m.shell_viewing()}</span>
                </ToggleGroup.Item>
                <ToggleGroup.Item value="edit" aria-label={m.shell_editing()}>
                    <PencilIcon class="size-4" />
                    <span class="hidden sm:inline">{m.shell_editing()}</span>
                </ToggleGroup.Item>
            </ToggleGroup.Root>
        {:else}
            <Tooltip.Root>
                <Tooltip.Trigger>
                    {#snippet child({ props })}
                        <Badge {...props} variant="secondary" class="gap-1">
                            <EyeIcon />
                            {m.shell_view_only()}
                        </Badge>
                    {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>{m.shell_view_only_hint()}</Tooltip.Content>
            </Tooltip.Root>
        {/if}
    </div>
</div>
