<script lang="ts">
	import { XIcon } from "@lucide/svelte";
	import { tick } from "svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Tabs from "#lib/components/ui/tabs/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import CommentBox from "./comment-box.svelte";
	import CommentThread from "./comment-thread.svelte";
	import type { Comments } from "./comments.svelte.js";

	/**
	 * The comments side panel: a comment being written, then the threads,
	 * open or resolved. The same content sits in a column beside the editor
	 * and in a bottom sheet on a phone.
	 */
	const {
		comments,
		userId,
		onclose,
	}: { comments: Comments; userId: string | undefined; onclose: () => void } =
		$props();

	let list = $state<HTMLElement>();

	const shown = $derived(
		comments.showResolved ? comments.resolved : comments.unresolved,
	);

	function draftLabel(): string {
		const anchor = comments.draft;
		if (anchor?.kind === "text") {
			return `“${anchor.quote}”`;
		}
		if (anchor?.kind === "cell") {
			return `${anchor.sheet}!${anchor.cell}`;
		}
		return anchor ? m.shell_on_slide({ number: String(anchor.index + 1) }) : "";
	}

	// The thread in focus scrolls into view, from a click in the editor.
	$effect(() => {
		const id = comments.active;
		if (!id) {
			return;
		}
		void tick().then(() =>
			list
				?.querySelector(`[data-thread="${CSS.escape(id)}"]`)
				?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
		);
	});
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex items-center gap-2">
        <h2 class="flex-1 text-sm font-semibold">{m.shell_comments()}</h2>
        <Button
            variant="ghost"
            size="icon"
            class="size-8"
            aria-label={m.close()}
            onclick={onclose}
        >
            <XIcon class="size-4" />
        </Button>
    </div>

    <Tabs.Root
        value={comments.showResolved ? "resolved" : "open"}
        onValueChange={(value) => (comments.showResolved = value === "resolved")}
    >
        <Tabs.List class="grid w-full grid-cols-2">
            <Tabs.Trigger value="open">
                {m.shell_show_open()} · {comments.unresolved.length}
            </Tabs.Trigger>
            <Tabs.Trigger value="resolved">
                {m.shell_show_resolved()} · {comments.resolved.length}
            </Tabs.Trigger>
        </Tabs.List>
    </Tabs.Root>

    <div bind:this={list} class="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2">
        {#if comments.draft}
            <div class="bg-card ring-primary flex flex-col gap-2 rounded-lg border p-3 ring-2">
                <p
                    class="text-muted-foreground border-primary/60 line-clamp-2 border-s-2 ps-2 text-xs italic wrap-break-word"
                >
                    {draftLabel()}
                </p>
                <CommentBox
                    placeholder={m.shell_comment_placeholder()}
                    label={m.shell_comment()}
                    autofocus
                    oncancel={() => (comments.draft = null)}
                    onsubmit={(body) => comments.submit(body)}
                />
            </div>
        {/if}
        {#each shown as thread (thread.root.id)}
            <CommentThread {thread} {comments} {userId} />
        {:else}
            {#if !comments.draft}
                <p class="text-muted-foreground px-2 py-6 text-center text-sm">
                    {comments.showResolved ? m.shell_no_resolved() : m.shell_no_comments()}
                </p>
            {/if}
        {/each}
    </div>
</div>
