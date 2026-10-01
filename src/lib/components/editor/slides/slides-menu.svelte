<script lang="ts">
	import {
		AlignCenterHorizontalIcon,
		AlignCenterVerticalIcon,
		AlignEndHorizontalIcon,
		AlignEndVerticalIcon,
		AlignHorizontalSpaceAroundIcon,
		AlignStartHorizontalIcon,
		AlignStartVerticalIcon,
		AlignVerticalSpaceAroundIcon,
		ArrowUpRightIcon,
		BringToFrontIcon,
		ClipboardPasteIcon,
		CopyIcon,
		CopyPlusIcon,
		EyeOffIcon,
		GroupIcon,
		ImageIcon,
		MaximizeIcon,
		MessageSquarePlusIcon,
		PaletteIcon,
		PlayIcon,
		PlusIcon,
		PresentationIcon,
		Redo2Icon,
		ScissorsIcon,
		SendToBackIcon,
		SlashIcon,
		SquareMousePointerIcon,
		StickyNoteIcon,
		Trash2Icon,
		TypeIcon,
		Undo2Icon,
		UngroupIcon,
		ZoomInIcon,
		ZoomOutIcon,
	} from "@lucide/svelte";
	import type { Component, Snippet } from "svelte";
	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { keyLabel } from "#lib/editor/document-format.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { AlignMode, Order } from "#lib/slides/edit.js";
	import type { EditorMenuContext } from "../shell/file-actions.js";
	import type { SlidesEditor } from "./state.svelte.js";

	/**
	 * The menus. A leading File menu is whoever embeds the editor's to give:
	 * the office shell shares one across the three editors.
	 */
	let {
		editor,
		menu,
		onComment,
		notes = $bindable(),
		onImage,
		onPresent,
		onPresenter,
		onTheme,
		onFullscreen,
	}: {
		editor: SlidesEditor;
		menu?: Snippet<[EditorMenuContext]>;
		/** Starts a comment on the current slide. */
		onComment?: () => void;
		notes: boolean;
		onImage: () => void;
		onPresent: () => void;
		onPresenter: () => void;
		onTheme: () => void;
		onFullscreen: () => void;
	} = $props();

	const none = $derived(editor.selected.length === 0);
	const one = $derived(editor.selected.length === 1);
	const edit = $derived(!editor.readOnly);
	const apple =
		typeof navigator !== "undefined" &&
		/Mac|iP(hone|ad|od)/.test(navigator.platform);

	const ORDER: [Order, () => string, Component][] = [
		["front", m.slides_bring_front, BringToFrontIcon],
		["forward", m.slides_bring_forward, BringToFrontIcon],
		["backward", m.slides_send_backward, SendToBackIcon],
		["back", m.slides_send_back, SendToBackIcon],
	];
	const ALIGN: [AlignMode, () => string, Component][] = [
		["left", m.slides_align_left, AlignStartVerticalIcon],
		["center", m.slides_align_center, AlignCenterVerticalIcon],
		["right", m.slides_align_right, AlignEndVerticalIcon],
		["top", m.slides_align_top, AlignStartHorizontalIcon],
		["middle", m.slides_align_middle, AlignCenterHorizontalIcon],
		["bottom", m.slides_align_bottom, AlignEndHorizontalIcon],
	];
</script>

{#snippet item(label: string, Icon: Component, run: () => void, disabled = false, shortcut = "")}
	<Menubar.Item {disabled} onSelect={run}>
		<Icon class="size-4" />
		{label}
		{#if shortcut}
			<Menubar.Shortcut>{keyLabel(shortcut, apple)}</Menubar.Shortcut>
		{/if}
	</Menubar.Item>
{/snippet}

<div class="flex shrink-0 items-center gap-2">
<Menubar.Root class="w-fit max-w-full min-w-0 overflow-x-auto">
	{@render menu?.({})}
	{#if edit}
		<Menubar.Menu>
			<Menubar.Trigger>{m.menu_edit()}</Menubar.Trigger>
			<Menubar.Content>
				{@render item(m.editor_undo(), Undo2Icon, () => editor.undo(), !editor.canUndo, "Mod-z")}
				{@render item(m.editor_redo(), Redo2Icon, () => editor.redo(), !editor.canRedo, "Mod-Shift-z")}
				<Menubar.Separator />
				{@render item(m.slides_cut(), ScissorsIcon, () => editor.copy(null) && editor.remove(), none, "Mod-x")}
				{@render item(m.slides_copy(), CopyIcon, () => editor.copy(null), none, "Mod-c")}
				{@render item(m.slides_paste(), ClipboardPasteIcon, () => editor.paste(undefined), false, "Mod-v")}
				{@render item(m.slides_duplicate(), CopyPlusIcon, () => editor.duplicate(), none, "Mod-d")}
				{@render item(m.slides_delete(), Trash2Icon, () => editor.remove(), none, "Delete")}
				<Menubar.Separator />
				{@render item(
					m.slides_select_all(),
					SquareMousePointerIcon,
					() => editor.select(editor.slide?.elements.map((element) => element.id) ?? []),
					false,
					"Mod-a",
				)}
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>{m.menu_insert()}</Menubar.Trigger>
			<Menubar.Content>
				{@render item(m.slides_tool_text(), TypeIcon, () => (editor.tool = "text"))}
				{@render item(m.slides_tool_image(), ImageIcon, onImage)}
				{@render item(m.slides_tool_line(), SlashIcon, () => (editor.tool = "line"))}
				{@render item(m.slides_tool_arrow(), ArrowUpRightIcon, () => (editor.tool = "arrow"))}
				<Menubar.Separator />
				{@render item(m.slides_new_slide(), PlusIcon, () => editor.addSlide(editor.slide?.layout ?? ""))}
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>{m.slides_arrange()}</Menubar.Trigger>
			<Menubar.Content>
				{#each ORDER as [order, label, Icon] (order)}
					{@render item(label(), Icon, () => editor.arrange(order), none)}
				{/each}
				<Menubar.Separator />
				{#each ALIGN as [mode, label, Icon] (mode)}
					{@render item(label(), Icon, () => editor.align(mode), none)}
				{/each}
				<Menubar.Separator />
				{@render item(m.slides_distribute_h(), AlignHorizontalSpaceAroundIcon, () => editor.distribute("x"), editor.selected.length < 3)}
				{@render item(m.slides_distribute_v(), AlignVerticalSpaceAroundIcon, () => editor.distribute("y"), editor.selected.length < 3)}
				<Menubar.Separator />
				{@render item(m.slides_group(), GroupIcon, () => editor.group(), editor.selected.length < 2, "Mod-g")}
				{@render item(
					m.slides_ungroup(),
					UngroupIcon,
					() => editor.ungroup(),
					!one || editor.selection[0]?.kind !== "group",
					"Mod-Shift-g",
				)}
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu>
			<Menubar.Trigger>{m.menu_slide()}</Menubar.Trigger>
			<Menubar.Content>
				{@render item(m.slides_new_slide(), PlusIcon, () => editor.addSlide(editor.slide?.layout ?? ""))}
				{@render item(m.deck_duplicate_slide(), CopyPlusIcon, () => editor.duplicateSlide(editor.current))}
				{@render item(
					editor.slide?.hidden ? m.slides_show_slide() : m.slides_hide_slide(),
					EyeOffIcon,
					() => editor.toggleHidden(editor.current),
				)}
				{@render item(
					m.deck_delete_slide(),
					Trash2Icon,
					() => editor.deleteSlide(editor.current),
					editor.deck.slides.length <= 1,
				)}
				<Menubar.Separator />
				{@render item(m.slides_background_reset(), PaletteIcon, () => editor.setBackground(undefined), !editor.slide?.background)}
				{@render item(m.slides_change_theme(), PaletteIcon, onTheme)}
			</Menubar.Content>
		</Menubar.Menu>
	{/if}
	<Menubar.Menu>
		<Menubar.Trigger>{m.menu_view()}</Menubar.Trigger>
		<Menubar.Content>
			{@render item(m.deck_present(), PlayIcon, onPresent)}
			{@render item(m.deck_presenter_view(), PresentationIcon, onPresenter)}
			{@render item(m.deck_fullscreen(), MaximizeIcon, onFullscreen)}
			<Menubar.Separator />
			{@render item(m.slides_zoom_in(), ZoomInIcon, () => (editor.zoom = Math.min(4, (editor.zoom ?? editor.fitZoom) * 1.25)))}
			{@render item(m.slides_zoom_out(), ZoomOutIcon, () => (editor.zoom = Math.max(0.1, (editor.zoom ?? editor.fitZoom) / 1.25)))}
			{@render item(m.slides_zoom_fit(), MaximizeIcon, () => (editor.zoom = null))}
			<Menubar.Separator />
			<Menubar.CheckboxItem bind:checked={notes}>
				<StickyNoteIcon class="size-4" />
				{m.deck_speaker_notes()}
			</Menubar.CheckboxItem>
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>
	{#if onComment}
		<button
			type="button"
			class="hover:bg-muted ms-auto flex size-8 shrink-0 items-center justify-center rounded-md border"
			aria-label={m.shell_add_comment()}
			title={m.shell_add_comment()}
			onclick={onComment}
		>
			<MessageSquarePlusIcon class="size-4" />
		</button>
	{/if}
</div>
