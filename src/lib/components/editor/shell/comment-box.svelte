<script lang="ts">
	import { untrack } from "svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { m } from "#lib/paraglide/messages.js";

	/** Where a comment, a reply or an edit is typed. Enter sends. */
	const {
		placeholder,
		label,
		initial = "",
		autofocus = false,
		onsubmit,
		oncancel,
	}: {
		placeholder: string;
		label: string;
		initial?: string;
		autofocus?: boolean;
		/** Resolves to whether it was saved; the box empties if so. */
		onsubmit: (body: string) => Promise<boolean>;
		oncancel?: () => void;
	} = $props();

	let body = $state(untrack(() => initial));
	let saving = $state(false);
	let box = $state<HTMLTextAreaElement | null>(null);

	$effect(() => {
		if (autofocus) {
			box?.focus();
		}
	});

	async function send() {
		const text = body.trim();
		if (!text || saving) {
			return;
		}
		saving = true;
		if (await onsubmit(text)) {
			body = "";
		}
		saving = false;
	}
</script>

<div class="flex flex-col gap-2">
    <Textarea
        bind:ref={box}
        bind:value={body}
        rows={2}
        {placeholder}
        aria-label={placeholder}
        class="min-h-16 text-sm"
        onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
            } else if (e.key === "Escape" && oncancel) {
                e.preventDefault();
                oncancel();
            }
        }}
    />
    <div class="flex justify-end gap-2">
        {#if oncancel}
            <Button variant="ghost" size="sm" onclick={oncancel}>{m.cancel()}</Button>
        {/if}
        <Button size="sm" loading={saving} disabled={!body.trim()} onclick={send}>
            {label}
        </Button>
    </div>
</div>
