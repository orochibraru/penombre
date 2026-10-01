<script lang="ts">
	import { isApple } from "prosekit/core";
	import * as Dialog from "#lib/components/ui/dialog/index.js";
	import { keyLabel } from "#lib/editor/document-format.js";
	import { m } from "#lib/paraglide/messages.js";

	let { open = $bindable(false) }: { open?: boolean } = $props();

	/** The bindings ProseKit and the editor define, as ProseMirror spells them. */
	const groups = (): [string, string][][] => [
		[
			[m.editor_undo(), "Mod-z"],
			[m.editor_redo(), "Mod-Shift-z"],
			[m.doc_find(), "Mod-f"],
			[m.doc_find_replace(), "Mod-Shift-h"],
			[m.editor_link(), "Mod-k"],
			[m.doc_print(), "Mod-p"],
		],
		[
			[m.editor_bold(), "Mod-b"],
			[m.editor_italic(), "Mod-i"],
			[m.editor_underline(), "Mod-u"],
			[m.editor_strikethrough(), "Mod-Shift-s"],
			[m.editor_inline_code(), "Mod-e"],
			[m.doc_superscript(), "Mod-."],
			[m.doc_subscript(), "Mod-,"],
			[m.doc_clear_formatting(), "Mod-\\"],
		],
		[
			[m.editor_normal_text(), "Mod-Alt-0"],
			...[1, 2, 3].map((level): [string, string] => [
				m.editor_heading({ level: String(level) }),
				`Mod-Alt-${level}`,
			]),
			[m.editor_quote(), "Mod-Shift-b"],
			[m.editor_align_left(), "Mod-Shift-l"],
			[m.editor_align_center(), "Mod-Shift-e"],
			[m.editor_align_right(), "Mod-Shift-r"],
			[m.editor_align_justify(), "Mod-Shift-j"],
			[m.doc_indent(), "Mod-]"],
			[m.doc_outdent(), "Mod-["],
			[m.doc_line_break(), "Shift-Enter"],
		],
	];
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>{m.doc_shortcuts()}</Dialog.Title>
		</Dialog.Header>
		<div class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
			{#each groups() as group, index (index)}
				<dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
					{#each group as [label, binding] (binding)}
						<dt class="text-muted-foreground">{label}</dt>
						<dd>
							<kbd class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs"
								>{keyLabel(binding, isApple)}</kbd
							>
						</dd>
					{/each}
				</dl>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
