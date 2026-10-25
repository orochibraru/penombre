<script lang="ts">
	import {
		CheckIcon,
		ChevronLeftIcon,
		ChevronRightIcon,
		XIcon,
	} from "@lucide/svelte";

	import { Button } from "#lib/components/ui/button/index.js";
	import { colourFor, initials } from "#lib/editor/presence.js";
	import type { Suggestion } from "#lib/editor/suggestions.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";

	/** One suggestion: who, when, what, and Accept / Reject for a writer. */
	const {
		suggestion,
		index,
		total,
		canReview,
		onaccept,
		onreject,
		onstep,
	}: {
		suggestion: Suggestion;
		index: number;
		total: number;
		canReview: boolean;
		onaccept: () => void;
		onreject: () => void;
		onstep: (by: 1 | -1) => void;
	} = $props();

	const quote = (text: string) =>
		text.length > 80 ? `${text.slice(0, 79)}…` : text;

	const what = $derived.by(() => {
		const inserted = quote(suggestion.inserted.trim());
		const deleted = quote(suggestion.deleted.trim());
		if (inserted && deleted) {
			return m.doc_suggestion_replace({ deleted, inserted });
		}
		if (inserted) {
			return m.doc_suggestion_add({ text: inserted });
		}
		if (deleted) {
			return m.doc_suggestion_delete({ text: deleted });
		}
		return m.doc_suggestion_break();
	});

	const when = $derived(
		suggestion.date
			? new Date(suggestion.date).toLocaleString(undefined, {
					dateStyle: "short",
					timeStyle: "short",
				})
			: "",
	);

	const who = $derived(suggestion.author || m.unknown());
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<span
			class={cn(
				"flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold text-white",
				colourFor(suggestion.authorId || suggestion.author),
			)}
			aria-hidden="true"
		>
			{initials(who)}
		</span>
		<span class="min-w-0 flex-1 leading-tight">
			<span class="block truncate text-sm font-medium">{who}</span>
			{#if when}
				<span class="text-muted-foreground block text-xs">{when}</span>
			{/if}
		</span>
		{#if canReview}
			<Button
				variant="ghost"
				size="icon"
				class="text-primary size-7"
				aria-label={m.doc_suggestion_accept()}
				title={m.doc_suggestion_accept()}
				onclick={onaccept}
			>
				<CheckIcon class="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="size-7"
				aria-label={m.doc_suggestion_reject()}
				title={m.doc_suggestion_reject()}
				onclick={onreject}
			>
				<XIcon class="size-4" />
			</Button>
		{/if}
	</div>
	<p class="text-sm wrap-break-word">{what}</p>
	{#if total > 1}
		<div
			class="text-muted-foreground flex items-center justify-end gap-1 text-xs tabular-nums"
		>
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				aria-label={m.doc_suggestion_previous()}
				onclick={() => onstep(-1)}
			>
				<ChevronLeftIcon class="size-3.5" />
			</Button>
			{m.doc_suggestion_position({
				index: String(index + 1),
				total: String(total),
			})}
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				aria-label={m.doc_suggestion_next()}
				onclick={() => onstep(1)}
			>
				<ChevronRightIcon class="size-3.5" />
			</Button>
		</div>
	{/if}
</div>
