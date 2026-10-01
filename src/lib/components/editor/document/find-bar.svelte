<script lang="ts">
	import {
		CaseSensitiveIcon,
		ChevronDownIcon,
		ChevronUpIcon,
		ReplaceIcon,
		XIcon,
	} from "@lucide/svelte";
	import { getSearchStatus } from "prosekit/extensions/search";
	import { onDestroy } from "svelte";
	import { Button } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import type { DocumentEditor } from "#lib/editor/document-extension.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";

	let {
		editor,
		revision,
		request,
		replacing = $bindable(false),
		onClose,
	}: {
		editor: DocumentEditor;
		/** Bumped on every transaction, so the match count is read again. */
		revision: number;
		/** Bumped each time the page asks for the bar, to take the focus back. */
		request: number;
		replacing?: boolean;
		onClose: () => void;
	} = $props();

	let search = $state("");
	let replace = $state("");
	let caseSensitive = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	const status = $derived.by(() => {
		void revision;
		return getSearchStatus(editor.state);
	});

	$effect(() => {
		void request;
		input?.focus();
		input?.select();
	});

	// A no-op when nothing changed, so it can run on every keystroke.
	$effect(() => {
		editor.commands.setSearchQuery({
			search,
			replace,
			caseSensitive,
			literal: true,
		});
	});

	onDestroy(() => {
		editor.commands.setSearchQuery({ search: "" });
	});

	function onFindKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			event.preventDefault();
			if (event.shiftKey) {
				editor.commands.findPrev();
			} else {
				editor.commands.findNext();
			}
		} else if (event.key === "Escape") {
			event.preventDefault();
			onClose();
		}
	}

	function onReplaceKey(event: KeyboardEvent) {
		if (event.key === "Enter") {
			event.preventDefault();
			editor.commands.replaceNext();
		} else if (event.key === "Escape") {
			event.preventDefault();
			onClose();
		}
	}

	const icon = cn(toggleVariants({ size: "sm" }), "shrink-0");
</script>

<div class="flex flex-col gap-2 rounded-lg border p-1.5" role="search">
	<div class="flex items-center gap-1">
		<Input
			bind:ref={input}
			bind:value={search}
			placeholder={m.doc_find_placeholder()}
			aria-label={m.doc_find()}
			class="h-8 min-w-0 flex-1"
			onkeydown={onFindKey}
		/>
		<span
			class="text-muted-foreground shrink-0 px-1 text-xs tabular-nums"
			aria-live="polite"
		>
			{#if search && status.total === 0}
				{m.doc_find_none()}
			{:else if search}
				{m.doc_find_status({
					active: String(status.active),
					total: String(status.total),
				})}
			{/if}
		</span>
		<button
			type="button"
			class={icon}
			data-state={caseSensitive ? "on" : "off"}
			aria-pressed={caseSensitive}
			aria-label={m.doc_match_case()}
			title={m.doc_match_case()}
			onclick={() => (caseSensitive = !caseSensitive)}
		>
			<CaseSensitiveIcon class="size-4" />
		</button>
		<button
			type="button"
			class={icon}
			disabled={status.total === 0}
			aria-label={m.doc_find_previous()}
			title={m.doc_find_previous()}
			onclick={() => editor.commands.findPrev()}
		>
			<ChevronUpIcon class="size-4" />
		</button>
		<button
			type="button"
			class={icon}
			disabled={status.total === 0}
			aria-label={m.doc_find_next()}
			title={m.doc_find_next()}
			onclick={() => editor.commands.findNext()}
		>
			<ChevronDownIcon class="size-4" />
		</button>
		<button
			type="button"
			class={icon}
			data-state={replacing ? "on" : "off"}
			aria-pressed={replacing}
			aria-label={m.doc_find_replace()}
			title={m.doc_find_replace()}
			onclick={() => (replacing = !replacing)}
		>
			<ReplaceIcon class="size-4" />
		</button>
		<button
			type="button"
			class={icon}
			aria-label={m.close()}
			title={m.close()}
			onclick={onClose}
		>
			<XIcon class="size-4" />
		</button>
	</div>
	{#if replacing}
		<div class="flex flex-wrap items-center gap-1">
			<Input
				bind:value={replace}
				placeholder={m.doc_replace_placeholder()}
				aria-label={m.doc_replace_placeholder()}
				class="h-8 min-w-0 flex-1 basis-40"
				onkeydown={onReplaceKey}
			/>
			<Button
				variant="outline"
				size="sm"
				disabled={status.total === 0}
				onclick={() => editor.commands.replaceNext()}
			>
				{m.doc_replace()}
			</Button>
			<Button
				variant="outline"
				size="sm"
				disabled={status.total === 0}
				onclick={() => editor.commands.replaceAll()}
			>
				{m.doc_replace_all()}
			</Button>
		</div>
	{/if}
</div>
