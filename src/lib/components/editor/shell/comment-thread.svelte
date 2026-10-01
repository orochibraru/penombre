<script lang="ts">
	import {
		CheckIcon,
		EllipsisIcon,
		PencilIcon,
		RotateCcwIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import type { CommentNote, Thread } from "#lib/editor/comments.js";
	import { colourFor, initials } from "#lib/editor/presence.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import CommentBox from "./comment-box.svelte";
	import type { Comments } from "./comments.svelte.js";

	/** One thread: what it points at, its comments, and replying to it. */
	const {
		thread,
		comments,
		userId,
	}: { thread: Thread; comments: Comments; userId: string | undefined } =
		$props();

	const root = $derived(thread.root);
	const active = $derived(comments.active === root.id);
	const detached = $derived(comments.detached.has(root.id));
	let editing = $state<string | null>(null);

	function where(note: CommentNote): string | null {
		const anchor = note.anchor;
		if (anchor?.kind === "text") {
			return `“${anchor.quote}”`;
		}
		if (anchor?.kind === "cell") {
			return `${anchor.sheet}!${anchor.cell}`;
		}
		if (anchor?.kind === "slide") {
			return m.shell_on_slide({ number: String(anchor.index + 1) });
		}
		return null;
	}

	const when = (note: CommentNote) =>
		new Date(note.createdAt).toLocaleString(undefined, {
			dateStyle: "short",
			timeStyle: "short",
		});
</script>

{#snippet comment(note: CommentNote, first: boolean)}
    <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
            <span
                class={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold text-white",
                    colourFor(note.userId),
                )}
                aria-hidden="true"
            >
                {initials(note.authorName ?? "?")}
            </span>
            <span class="min-w-0 flex-1 leading-tight">
                <span class="block truncate text-sm font-medium">
                    {note.authorName ?? m.unknown()}
                </span>
                <span class="text-muted-foreground block text-xs">{when(note)}</span>
            </span>
            {#if first}
                <Button
                    variant="ghost"
                    size="icon"
                    class="size-7"
                    aria-label={root.resolvedAt ? m.shell_reopen() : m.shell_resolve()}
                    title={root.resolvedAt ? m.shell_reopen() : m.shell_resolve()}
                    onclick={(e: MouseEvent) => {
                        e.stopPropagation();
                        void comments.resolve(root.id, !root.resolvedAt);
                    }}
                >
                    {#if root.resolvedAt}
                        <RotateCcwIcon class="size-4" />
                    {:else}
                        <CheckIcon class="text-primary size-4" />
                    {/if}
                </Button>
            {/if}
            {#if note.userId === userId}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                        class="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md"
                        aria-label={m.shell_comment_actions()}
                        onclick={(e: MouseEvent) => e.stopPropagation()}
                    >
                        <EllipsisIcon class="size-4" />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Item onclick={() => (editing = note.id)}>
                            <PencilIcon class="text-primary size-4" />
                            {m.shell_edit_comment()}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            variant="destructive"
                            onclick={() => void comments.remove(note.id)}
                        >
                            <Trash2Icon class="size-4" />
                            {m.shell_delete_comment()}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            {/if}
        </div>
        {#if editing === note.id}
            <CommentBox
                placeholder={m.shell_comment_placeholder()}
                label={m.shell_save()}
                initial={note.body}
                autofocus
                oncancel={() => (editing = null)}
                onsubmit={async (body) => {
                    const saved = await comments.edit(note.id, body);
                    if (saved) {
                        editing = null;
                    }
                    return saved;
                }}
            />
        {:else}
            <p class="text-sm wrap-break-word whitespace-pre-wrap">{note.body}</p>
        {/if}
    </div>
{/snippet}

<!-- A div, not a button: it holds buttons and a text box. The keyboard
     reaches a thread through its own resolve and reply controls. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    data-thread={root.id}
    class={cn(
        "bg-card flex flex-col gap-3 rounded-lg border p-3 transition-shadow",
        active && "ring-primary ring-2",
        root.resolvedAt && "opacity-80",
    )}
    onclick={(e) => {
        // Typing a reply or pressing a button is not asking to see the text.
        if (!(e.target as Element).closest("textarea, button")) {
            comments.select(root.id);
        }
    }}
>
    {#if where(root)}
        <p
            class="text-muted-foreground border-primary/60 line-clamp-2 border-s-2 ps-2 text-xs italic wrap-break-word"
        >
            {where(root)}
        </p>
    {/if}
    {#if detached}
        <p class="text-destructive text-xs">{m.shell_detached()}</p>
    {/if}
    {@render comment(root, true)}
    {#each thread.replies as reply (reply.id)}
        <div class="border-s ps-3">
            {@render comment(reply, false)}
        </div>
    {/each}
    {#if root.resolvedAt}
        <p class="text-muted-foreground text-xs">
            {m.shell_resolved_by({ name: root.resolvedByName ?? m.unknown() })}
        </p>
    {:else if active}
        <CommentBox
            placeholder={m.shell_reply_placeholder()}
            label={m.shell_reply()}
            onsubmit={(body) => comments.reply(root.id, body)}
        />
    {/if}
</div>
