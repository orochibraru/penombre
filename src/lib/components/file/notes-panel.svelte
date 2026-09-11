<script lang="ts">
	import { ClockIcon, SendIcon, Trash2Icon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "$lib/api";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { cn } from "$lib/utils";

	/**
	 * Notes attached to one file.
	 *
	 * `position` is where the file is currently playing, when it is playing at
	 * all. When it is defined the note is offered a timestamp, which is what
	 * turns this from a comment thread into Soundcloud-style feedback.
	 */
	let {
		fileId,
		position,
		onSeek,
		currentUserId,
		focus = $bindable(),
	}: {
		fileId: string;
		position?: number;
		onSeek?: (seconds: number) => void;
		currentUserId?: string;
		/**
		 * Handed back to the parent so clicking a moment on the waveform can
		 * put the caret straight in the box — the reason to click one is
		 * almost always to write about it.
		 */
		focus?: () => void;
	} = $props();

	let box = $state<HTMLTextAreaElement | null>(null);

	focus = () => {
		// After the parent's own state settles, or the box may not be shown yet.
		requestAnimationFrame(() => box?.focus());
	};

	interface Note {
		id: string;
		userId: string;
		authorName: string | null;
		body: string;
		timestampSeconds: number | null;
		createdAt: string;
	}

	let notes = $state<Note[]>([]);
	let draft = $state("");
	let attachTime = $state(true);
	let loading = $state(true);
	let saving = $state(false);

	const stamp = (seconds: number) => {
		const total = Math.max(0, Math.floor(seconds));
		const minutes = Math.floor(total / 60);
		return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
	};

	/** Only offer a timestamp when there is a playhead to read one from. */
	const canStamp = $derived(position !== undefined);

	async function load() {
		loading = true;
		const { data, error } = await api.GET("/api/v1/files/{fileId}/notes", {
			params: { path: { fileId } },
		});
		loading = false;
		if (error) {
			toast.error(m.notes_load_error());
			return;
		}
		notes = (data?.data ?? []) as Note[];
	}

	$effect(() => {
		if (fileId) {
			void load();
		}
	});

	async function submit() {
		const body = draft.trim();
		if (!body) {
			return;
		}
		saving = true;
		const { data, error } = await api.POST("/api/v1/files/{fileId}/notes", {
			params: { path: { fileId } },
			body: {
				body,
				timestampSeconds: canStamp && attachTime ? position : null,
			},
		});
		saving = false;
		if (error) {
			toast.error(m.notes_save_error());
			return;
		}
		if (data?.data) {
			notes = [...notes, data.data as Note].sort(
				(a, b) =>
					(a.timestampSeconds ?? Number.POSITIVE_INFINITY) -
					(b.timestampSeconds ?? Number.POSITIVE_INFINITY),
			);
		}
		draft = "";
	}

	async function remove(id: string) {
		const { error } = await api.DELETE(
			"/api/v1/files/{fileId}/notes/{noteId}",
			{ params: { path: { fileId, noteId: id } } },
		);
		if (error) {
			toast.error(m.notes_delete_error());
			return;
		}
		notes = notes.filter((note) => note.id !== id);
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-3">
    <h3 class="text-sm font-medium">{m.notes_title()}</h3>

    <ul class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {#each notes as note (note.id)}
            <li class="bg-muted/40 flex flex-col gap-1 rounded-lg border p-2.5">
                <div class="flex items-center gap-2">
                    {#if note.timestampSeconds !== null}
                        <!-- A timestamp is a control, not a label: clicking it
                             moves the playhead to that moment. -->
                        <button
                            type="button"
                            class="text-primary hover:bg-primary/10 flex items-center gap-1 rounded px-1 font-mono text-xs tabular-nums transition-colors"
                            onclick={() => onSeek?.(note.timestampSeconds ?? 0)}
                            disabled={!onSeek}
                        >
                            <ClockIcon class="size-3" />
                            {stamp(note.timestampSeconds)}
                        </button>
                    {/if}
                    <span class="text-muted-foreground truncate text-xs">
                        {note.authorName ?? m.unknown()}
                    </span>
                    {#if note.userId === currentUserId}
                        <button
                            type="button"
                            class="text-muted-foreground hover:text-destructive ms-auto transition-colors"
                            aria-label={m.delete()}
                            onclick={() => remove(note.id)}
                        >
                            <Trash2Icon class="size-3.5" />
                        </button>
                    {/if}
                </div>
                <p class="text-sm wrap-break-word whitespace-pre-wrap">
                    {note.body}
                </p>
            </li>
        {:else}
            <li class="text-muted-foreground py-6 text-center text-sm">
                {loading ? m.loading() : m.notes_empty()}
            </li>
        {/each}
    </ul>

    <div class="flex flex-col gap-2">
        <Textarea
            bind:ref={box}
            bind:value={draft}
            rows={3}
            placeholder={m.notes_placeholder()}
            onkeydown={(e: KeyboardEvent) => {
                // Enter sends, shift+enter breaks the line — the convention
                // every comment box has trained people on.
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                }
            }}
        />
        <div class="flex items-center justify-between gap-2">
            {#if canStamp}
                <label
                    class={cn(
                        "flex cursor-pointer items-center gap-2 text-xs",
                        attachTime ? "text-foreground" : "text-muted-foreground",
                    )}
                >
                    <input
                        type="checkbox"
                        bind:checked={attachTime}
                        class="accent-primary size-3.5"
                    />
                    {m.notes_at_time({ time: stamp(position ?? 0) })}
                </label>
            {:else}
                <span></span>
            {/if}
            <Button size="sm" loading={saving} onclick={submit}>
                <SendIcon class="size-3.5" />
                {m.notes_add()}
            </Button>
        </div>
    </div>
</div>
