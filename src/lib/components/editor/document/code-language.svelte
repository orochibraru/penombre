<script lang="ts">
	import * as Select from "#lib/components/ui/select/index.js";
	import { CODE_LANGUAGES } from "#lib/editor/code-block.js";
	import { m } from "#lib/paraglide/messages.js";

	/** A code block's language, picked above the block. */
	const {
		value,
		onPick,
	}: { value: string; onPick: (language: string) => void } = $props();

	const PLAIN = "plain";

	const choices = $derived([
		{ value: PLAIN, label: m.office_code_plain() },
		...CODE_LANGUAGES,
		...(value && !CODE_LANGUAGES.some((choice) => choice.value === value)
			? [{ value, label: value }]
			: []),
	]);
	const label = $derived(
		choices.find((choice) => choice.value === (value || PLAIN))?.label,
	);
</script>

<Select.Root
	type="single"
	value={value || PLAIN}
	onValueChange={(next) => onPick(next === PLAIN ? "" : next)}
>
	<Select.Trigger
		size="sm"
		aria-label={m.office_code_language()}
		class="bg-muted text-muted-foreground h-7! gap-1 border-none px-2 text-xs shadow-none"
	>
		{label}
	</Select.Trigger>
	<Select.Content class="max-h-72">
		{#each choices as choice (choice.value)}
			<Select.Item value={choice.value} label={choice.label} />
		{/each}
	</Select.Content>
</Select.Root>
