<script lang="ts">
	import { ExternalLinkIcon, LinkIcon, UnlinkIcon } from "@lucide/svelte";
	import { untrack } from "svelte";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import * as Popover from "#lib/components/ui/popover/index.js";
	import {
		type DocumentEditor,
		markValue,
	} from "#lib/editor/document-extension.js";
	import { linkTarget } from "#lib/editor/document-format.js";
	import { m } from "#lib/paraglide/messages.js";

	let {
		editor,
		active,
		open = $bindable(false),
		class: className,
	}: {
		editor: DocumentEditor;
		/** Whether the selection is on a link. */
		active: boolean;
		open?: boolean;
		class?: string;
	} = $props();

	let href = $state("");
	let invalid = $state(false);

	// Opened from the toolbar, the menu or Mod-K alike: start from the link
	// the caret is on, so editing one does not mean retyping it.
	$effect(() => {
		if (open) {
			untrack(() => {
				href = markValue(editor.state, "link", "href") ?? "";
				invalid = false;
			});
		}
	});

	function unlink() {
		editor.commands.expandLink();
		editor.commands.removeLink();
	}

	function apply(event: SubmitEvent) {
		event.preventDefault();
		if (!href.trim()) {
			open = false;
			unlink();
			editor.focus();
			return;
		}
		const url = linkTarget(href);
		if (!url) {
			invalid = true;
			return;
		}
		open = false;
		if (active) {
			editor.commands.expandLink();
		}
		const { state } = editor;
		if (state.selection.empty) {
			const mark = state.schema.marks.link?.create({ href: url });
			editor.view.dispatch(
				state.tr.replaceSelectionWith(
					state.schema.text(url, mark ? [mark] : []),
					false,
				),
			);
		} else {
			editor.commands.addLink({ href: url });
		}
		editor.focus();
	}

	const current = $derived(linkTarget(href));
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={className}
		data-state={active ? "on" : "off"}
		aria-label={m.editor_link()}
		title={m.editor_link()}
		onmousedown={(e: MouseEvent) => e.preventDefault()}
	>
		<LinkIcon class="size-4" />
	</Popover.Trigger>
	<Popover.Content
		class="w-80 max-w-[calc(100vw-2rem)] p-3"
		onCloseAutoFocus={(e: Event) => {
			e.preventDefault();
			editor.focus();
		}}
	>
		<form class="flex flex-col gap-2" onsubmit={apply}>
			<div class="flex gap-2">
				<Input
					type="text"
					inputmode="url"
					placeholder="https://"
					bind:value={href}
					aria-label={m.editor_link()}
					aria-invalid={invalid}
					class="h-8 min-w-0 flex-1"
					oninput={() => (invalid = false)}
				/>
				<Button type="submit" size="sm">
					{href.trim() || !active
						? m.editor_link_apply()
						: m.editor_link_remove()}
				</Button>
			</div>
			{#if invalid}
				<p class="text-destructive text-xs">{m.doc_link_invalid()}</p>
			{/if}
			{#if active}
				<div class="flex gap-2">
					{#if current}
						<a
							class={buttonVariants({ variant: "ghost", size: "sm" })}
							href={current}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon class="size-4" />
							{m.doc_link_open()}
						</a>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						onclick={() => {
							open = false;
							unlink();
							editor.focus();
						}}
					>
						<UnlinkIcon class="size-4" />
						{m.editor_link_remove()}
					</Button>
				</div>
			{/if}
		</form>
	</Popover.Content>
</Popover.Root>
