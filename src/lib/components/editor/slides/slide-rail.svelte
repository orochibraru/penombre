<script lang="ts">
	import {
		ArrowDownIcon,
		ArrowUpIcon,
		CopyIcon,
		EllipsisVerticalIcon,
		EyeIcon,
		EyeOffIcon,
		GripVerticalIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn } from "#lib/utils.js";
	import LayoutPicker from "./layout-picker.svelte";
	import type { RenderContext } from "./render-context.js";
	import SlideView from "./slide-view.svelte";
	import type { SlidesEditor } from "./state.svelte.js";

	/**
	 * Every slide as a thumbnail. Dragging one moves it: with a mouse from
	 * anywhere on it, on a touch screen from its grip, so the strip still
	 * scrolls under a finger.
	 */
	let {
		editor,
		media,
		label,
		marked,
	}: {
		editor: SlidesEditor;
		media: RenderContext["media"];
		label: RenderContext["label"];
		/** Slides with an open comment thread. */
		marked?: ReadonlySet<number>;
	} = $props();

	let list = $state<HTMLOListElement>();
	let drag = $state<{
		from: number;
		to: number;
		pointer: number;
		x: number;
		y: number;
		active: boolean;
	} | null>(null);
	let dragged = false;
	let width = $state(160);

	function dropIndex(x: number, y: number): number {
		if (!list) {
			return 0;
		}
		const vertical = getComputedStyle(list).flexDirection === "column";
		const items = [...list.querySelectorAll<HTMLElement>("[data-slide]")];
		const at = items.findIndex((item) => {
			const box = item.getBoundingClientRect();
			return vertical
				? y < box.top + box.height / 2
				: x < box.left + box.width / 2;
		});
		return at === -1 ? items.length : at;
	}

	function start(event: PointerEvent, index: number) {
		dragged = false;
		const grip = (event.target as Element).closest("[data-grip]");
		if (
			editor.readOnly ||
			event.button !== 0 ||
			(event.pointerType === "touch" && !grip)
		) {
			return;
		}
		drag = {
			from: index,
			to: index,
			pointer: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			active: false,
		};
		(event.currentTarget as Element).setPointerCapture(event.pointerId);
	}

	function move(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointer) {
			return;
		}
		if (
			!drag.active &&
			Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6
		) {
			return;
		}
		drag.active = true;
		drag.to = dropIndex(event.clientX, event.clientY);
	}

	function end(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointer) {
			return;
		}
		const { from, to, active } = drag;
		drag = null;
		if (active) {
			dragged = true;
			editor.moveSlide(from, to > from ? to - 1 : to);
		}
	}

	function pick(index: number) {
		if (dragged) {
			dragged = false;
			return;
		}
		editor.go(index);
	}

	function keydown(event: KeyboardEvent, index: number) {
		if (editor.readOnly) {
			return;
		}
		if (
			(event.metaKey || event.ctrlKey) &&
			(event.key === "ArrowUp" || event.key === "ArrowDown")
		) {
			event.preventDefault();
			editor.moveSlide(index, index + (event.key === "ArrowUp" ? -1 : 1));
		} else if (event.key === "Delete" || event.key === "Backspace") {
			event.preventDefault();
			editor.deleteSlide(index);
		}
	}

	function dropEdge(index: number): string | false {
		if (!drag?.active || drag.to === drag.from || drag.to === drag.from + 1) {
			return false;
		}
		if (drag.to === index) {
			return "shadow-[-5px_0_0_0_var(--primary)] sm:shadow-[0_-5px_0_0_var(--primary)]";
		}
		return (
			drag.to === editor.deck.slides.length &&
			index === editor.deck.slides.length - 1 &&
			"shadow-[5px_0_0_0_var(--primary)] sm:shadow-[0_5px_0_0_var(--primary)]"
		);
	}
</script>

<div class="flex shrink-0 flex-col gap-2 sm:w-52">
	<ol
		bind:this={list}
		class="flex min-h-0 flex-1 gap-2 overflow-x-auto p-1 select-none sm:flex-col sm:overflow-x-visible sm:overflow-y-auto"
		aria-label={m.slides_slides()}
	>
		{#each editor.deck.slides as slide, index (slide.id)}
			<li
				data-slide
				class={cn(
					"group relative w-36 shrink-0 rounded-lg sm:w-auto",
					drag?.active && drag.from === index && "opacity-40",
					dropEdge(index),
				)}
			>
				<button
					type="button"
					aria-label={m.deck_slide_label({ number: String(index + 1) })}
					aria-current={index === editor.current ? "true" : undefined}
					class={cn(
						"hover:border-primary/60 flex w-full items-start gap-1.5 rounded-lg border p-1.5 text-left transition-colors",
						index === editor.current && "border-primary bg-primary/5",
					)}
					onpointerdown={(event) => start(event, index)}
					onpointermove={move}
					onpointerup={end}
					onpointercancel={() => (drag = null)}
					onclick={() => pick(index)}
					onkeydown={(event) => keydown(event, index)}
				>
					<span class="flex w-4 flex-col items-center gap-1">
						<span class="text-muted-foreground text-[10px] tabular-nums">{index + 1}</span>
						{#if marked?.has(index)}
							<span class="bg-primary size-2 rounded-full rounded-bl-none" aria-hidden="true"></span>
						{/if}
						{#if slide.hidden}
							<EyeOffIcon class="text-muted-foreground size-3" aria-label={m.slides_hidden()} />
						{/if}
						{#if !editor.readOnly}
							<span data-grip class="text-muted-foreground -mx-1 touch-none px-1 py-1 sm:cursor-grab" title={m.deck_drag_slide()}>
								<GripVerticalIcon class="size-3" />
							</span>
						{/if}
					</span>
					<span class="min-w-0 flex-1" bind:clientWidth={width}>
						<SlideView
							deck={editor.deck}
							{slide}
							width={Math.max(40, width)}
							{media}
							{label}
							class={cn("pointer-events-none rounded-sm border", slide.hidden && "opacity-40")}
						/>
					</span>
				</button>
				{#if !editor.readOnly}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="bg-background/80 absolute top-2 right-2 rounded-md p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
							aria-label={m.slides_slide_actions()}
						>
							<EllipsisVerticalIcon class="size-3.5" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start">
							<DropdownMenu.Item onSelect={() => editor.duplicateSlide(index)}>
								<CopyIcon class="size-4" />
								{m.deck_duplicate_slide()}
							</DropdownMenu.Item>
							<DropdownMenu.Item onSelect={() => editor.toggleHidden(index)}>
								{#if slide.hidden}
									<EyeIcon class="size-4" />
									{m.slides_show_slide()}
								{:else}
									<EyeOffIcon class="size-4" />
									{m.slides_hide_slide()}
								{/if}
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item disabled={index === 0} onSelect={() => editor.moveSlide(index, index - 1)}>
								<ArrowUpIcon class="size-4" />
								{m.deck_move_up()}
							</DropdownMenu.Item>
							<DropdownMenu.Item
								disabled={index === editor.deck.slides.length - 1}
								onSelect={() => editor.moveSlide(index, index + 1)}
							>
								<ArrowDownIcon class="size-4" />
								{m.deck_move_down()}
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								variant="destructive"
								disabled={editor.deck.slides.length <= 1}
								onSelect={() => editor.deleteSlide(index)}
							>
								<Trash2Icon class="size-4" />
								{m.deck_delete_slide()}
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</li>
		{/each}
	</ol>
	{#if !editor.readOnly}
		<LayoutPicker {editor} {media} onPick={(part) => editor.addSlide(part)} />
	{/if}
</div>
