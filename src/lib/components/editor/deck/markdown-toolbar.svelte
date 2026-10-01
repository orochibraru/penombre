<script lang="ts">
	import {
		BoldIcon,
		CodeIcon,
		HeadingIcon,
		ImageIcon,
		ItalicIcon,
		LinkIcon,
		ListIcon,
		ListOrderedIcon,
		QuoteIcon,
		TableIcon,
	} from "@lucide/svelte";
	import type { Component } from "svelte";
	import { toast } from "svelte-sonner";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { toggleVariants } from "#lib/components/ui/toggle/toggle.svelte";
	import {
		bullets,
		code,
		cycleHeading,
		type Edit,
		image,
		link,
		numbers,
		quotes,
		table,
		wrap,
	} from "#lib/deck/edit.js";
	import { embedImage } from "#lib/deck/image.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";

	/**
	 * Markdown for people who do not write it: each button edits the
	 * textarea's text around the selection and puts the caret back.
	 */
	let {
		textarea,
		images,
	}: { textarea: HTMLTextAreaElement | null; images: boolean } = $props();

	type Command = (value: string, selection: [number, number]) => Edit;

	interface Tool {
		label: string;
		icon: Component;
		run: Command;
	}

	/**
	 * Applied through `insertText` so the browser's own undo takes it back;
	 * assigning `value` would wipe the undo history.
	 */
	function apply(command: Command) {
		if (!textarea) {
			return;
		}
		const edit = command(textarea.value, [
			textarea.selectionStart,
			textarea.selectionEnd,
		]);
		textarea.focus();
		textarea.setSelectionRange(edit.from, edit.to);
		const done = document.execCommand("insertText", false, edit.insert);
		if (!done) {
			textarea.setRangeText(edit.insert, edit.from, edit.to);
			textarea.dispatchEvent(new Event("input", { bubbles: true }));
		}
		textarea.setSelectionRange(...edit.selection);
	}

	const groups: Tool[][] = [
		[
			{ label: m.deck_heading(), icon: HeadingIcon, run: cycleHeading },
			{
				label: m.editor_bold(),
				icon: BoldIcon,
				run: (value, selection) =>
					wrap(value, selection, "**", m.editor_bold()),
			},
			{
				label: m.editor_italic(),
				icon: ItalicIcon,
				run: (value, selection) =>
					wrap(value, selection, "*", m.editor_italic()),
			},
			{
				label: m.editor_inline_code(),
				icon: CodeIcon,
				run: (value, selection) =>
					code(value, selection, m.editor_inline_code()),
			},
		],
		[
			{ label: m.editor_bullet_list(), icon: ListIcon, run: bullets },
			{ label: m.editor_numbered_list(), icon: ListOrderedIcon, run: numbers },
			{ label: m.editor_quote(), icon: QuoteIcon, run: quotes },
		],
		[
			{
				label: m.editor_link(),
				icon: LinkIcon,
				run: (value, selection) => link(value, selection, m.deck_link_text()),
			},
			{ label: m.editor_table(), icon: TableIcon, run: table },
		],
	];

	const SHORTCUTS: Record<string, Command | undefined> = {
		b: groups[0]?.[1]?.run,
		i: groups[0]?.[2]?.run,
		k: groups[2]?.[0]?.run,
	};

	$effect(() => {
		const target = textarea;
		if (!target) {
			return;
		}
		const onkey = (event: KeyboardEvent) => {
			const command = SHORTCUTS[event.key.toLowerCase()];
			if ((event.metaKey || event.ctrlKey) && !event.altKey && command) {
				event.preventDefault();
				apply(command);
			}
		};
		target.addEventListener("keydown", onkey);
		return () => target.removeEventListener("keydown", onkey);
	});

	let picker = $state<HTMLInputElement>();

	async function insertPicture(files: FileList | null) {
		const file = files?.[0];
		if (picker) {
			picker.value = "";
		}
		if (!file) {
			return;
		}
		try {
			const src = await embedImage(file);
			apply((value, selection) => image(value, selection, src));
		} catch {
			toast.error(m.editor_image_error());
		}
	}

	const button = cn(toggleVariants({ size: "sm" }), "shrink-0");
</script>

<!-- One scrolling row on a phone, wrapped from `sm` up. -->
<div
    role="toolbar"
    aria-label={m.deck_formatting()}
    class="flex items-center gap-1 overflow-x-auto rounded-lg border p-1 sm:flex-wrap sm:overflow-visible"
>
    {#each groups as group, index (index)}
        {#if index > 0}
            <div class="bg-border mx-0.5 h-5 w-px shrink-0"></div>
        {/if}
        {#each group as tool (tool.label)}
            {@const Icon = tool.icon}
            <button
                type="button"
                class={button}
                aria-label={tool.label}
                title={tool.label}
                onmousedown={(event) => event.preventDefault()}
                onclick={() => apply(tool.run)}
            >
                <Icon class="size-4" />
            </button>
        {/each}
    {/each}
    {#if images}
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                class={button}
                aria-label={m.editor_image()}
                title={m.editor_image()}
            >
                <ImageIcon class="size-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                align="start"
                onCloseAutoFocus={(event: Event) => event.preventDefault()}
            >
                <DropdownMenu.Item onSelect={() => picker?.click()}>
                    {m.deck_image_upload()}
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={() => apply(image)}>
                    {m.deck_image_link()}
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
        <input
            bind:this={picker}
            type="file"
            accept="image/*"
            class="hidden"
            onchange={(event) => void insertPicture(event.currentTarget.files)}
        />
    {/if}
</div>
