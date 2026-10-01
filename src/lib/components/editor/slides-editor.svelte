<script lang="ts">
	import { ChevronDownIcon, PaletteIcon, StickyNoteIcon } from "@lucide/svelte";
	import { type Snippet, untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { type Deck, nextElementId } from "#lib/slides/model.js";
	import { locationFrom, locationQuery } from "#lib/storage-location.js";
	import { cn, toggleFullscreen } from "#lib/utils.js";
	import { page } from "$app/state";
	import type { Comments } from "./shell/comments.svelte.js";
	import type { EditorMenuContext } from "./shell/file-actions.js";
	import Audience from "./slides/audience.svelte";
	import ColorPicker from "./slides/color-picker.svelte";
	import { coverPicture, placePicture, readPicture } from "./slides/images.js";
	import { placeholderPrompt, rawLabel } from "./slides/labels.js";
	import LayoutPicker from "./slides/layout-picker.svelte";
	import Present from "./slides/present.svelte";
	import Presenter from "./slides/presenter.svelte";
	import SlideCanvas from "./slides/slide-canvas.svelte";
	import SlideRail from "./slides/slide-rail.svelte";
	import SlidesMenu from "./slides/slides-menu.svelte";
	import { SlidesEditor } from "./slides/state.svelte.js";
	import ThemeDialog from "./slides/theme-dialog.svelte";
	import Toolbar from "./slides/toolbar.svelte";

	/**
	 * A presentation editor over a `.pptx`: the file's own slides, masters,
	 * layouts and theme, edited on a canvas and written back into the file.
	 * `content` is the deck as JSON (`#lib/slides/model`); `onChange` gets it
	 * back after every change.
	 */
	let {
		content,
		onChange,
		fileId,
		readOnly = false,
		menu,
		comments,
	}: {
		content: string;
		onChange: (json: string) => void;
		fileId: string;
		readOnly?: boolean;
		/** The shared File menu, first in the menu bar. */
		menu?: Snippet<[EditorMenuContext]>;
		/** Threads anchored to slides, by the slide's id and position. */
		comments?: Comments;
	} = $props();

	const editor = new SlidesEditor(
		untrack(() => content),
		(json) => onChange(json),
		untrack(() => fileId),
	);
	$effect.pre(() => {
		const value = readOnly;
		untrack(() => editor.setReadOnly(value));
	});

	/** Set in the window the presenter view opens for the audience. */
	const audience = page.url.searchParams.get("audience");
	const location = locationQuery(locationFrom(page.params, page.url));

	let mode = $state<"edit" | "present" | "presenter">("edit");
	let root = $state<HTMLElement>();
	let picker = $state<HTMLInputElement>();
	let notesOpen = $state(false);
	let themeOpen = $state(false);
	let notesFresh = true;
	/** A picture placeholder waiting for the file picker, by id. */
	let pictureFor: string | null = null;
	/** Whether this page asked for full screen, so leaving it ends the show. */
	let ownFullscreen = false;

	/** Each open thread's slide: by the slide's id, which survives a reorder, else its place. */
	const commented = $derived(
		new Map(
			(comments?.unresolved ?? []).flatMap((thread) => {
				const anchor = thread.root.anchor;
				if (anchor?.kind !== "slide") {
					return [];
				}
				const byId = anchor.id
					? editor.deck.slides.findIndex((slide) => slide.id === anchor.id)
					: -1;
				return [[byId === -1 ? anchor.index : byId, thread.root.id] as const];
			}),
		),
	);

	// On a slide with a thread, an open panel shows it.
	$effect(() => {
		const id = commented.get(editor.current);
		if (id) {
			untrack(() => comments?.follow(id));
		}
	});

	// A thread picked in the panel: its slide.
	$effect(() => {
		const request = comments?.reveal;
		if (!request) {
			return;
		}
		untrack(() => {
			const at = [...commented.entries()].find(
				([, id]) => id === request.id,
			)?.[0];
			if (at !== undefined && at < editor.deck.slides.length) {
				editor.go(at);
			}
		});
	});

	function comment() {
		const slide = editor.slide;
		if (slide) {
			comments?.start({ kind: "slide", index: editor.current, id: slide.id });
		}
	}

	function media(src: string): string | null {
		if (src.startsWith("data:")) {
			return src;
		}
		if (!src.startsWith("ppt/media/") || /\.(emf|wmf|tiff?)$/i.test(src)) {
			return null;
		}
		const query = `part=${encodeURIComponent(src)}${location ? `&${location}` : ""}`;
		return `/api/v1/documents/presentation/${encodeURIComponent(fileId)}/media?${query}`;
	}

	function present() {
		editor.stopEditing();
		mode = "present";
		if (!document.fullscreenElement && root?.requestFullscreen) {
			ownFullscreen = true;
			toggleFullscreen(root);
		}
	}

	function stopPresenting() {
		mode = "edit";
		if (ownFullscreen && document.fullscreenElement) {
			void document.exitFullscreen();
		}
		ownFullscreen = false;
	}

	function fullscreen() {
		ownFullscreen = !document.fullscreenElement;
		toggleFullscreen(root ?? null);
	}

	function pickPicture(placeholder: string | null) {
		pictureFor = placeholder;
		picker?.click();
	}

	async function addPictures(files: File[], at?: [number, number]) {
		const slide = editor.slide;
		if (!slide || editor.readOnly) {
			return;
		}
		try {
			const pictures = await Promise.all(
				files.map((file) => readPicture(file)),
			);
			const target = pictureFor
				? slide.elements.find((element) => element.id === pictureFor)
				: undefined;
			pictureFor = null;
			if (target && pictures[0]) {
				const picture = coverPicture(
					pictures[0],
					target,
					target.id,
					target.placeholder,
				);
				editor.edit(() => {
					slide.elements = slide.elements.map((element) =>
						element.id === target.id ? picture : element,
					);
				});
				editor.select([target.id]);
				return;
			}
			let id = Number(nextElementId(slide.elements));
			editor.add(
				pictures.map((picture) =>
					placePicture(
						picture,
						{ w: editor.deck.width, h: editor.deck.height },
						String(id++),
						at,
					),
				),
			);
		} catch {
			toast.error(m.slides_image_error());
		}
	}
</script>

<svelte:document
	onfullscreenchange={() => {
		if (!document.fullscreenElement && ownFullscreen && mode === "present") {
			stopPresenting();
		}
	}}
/>

{#snippet idle()}
	<ColorPicker
		label={m.slides_background()}
		icon={PaletteIcon}
		value={editor.slide?.background?.type === "solid" ? editor.slide.background.color : undefined}
		palette={editor.palette}
		none={m.slides_background_reset()}
		onPick={(color) => editor.setBackground(color ? { type: "solid", color } : undefined)}
	/>
	<div class="w-40 shrink-0">
		<LayoutPicker
			{editor}
			{media}
			label={m.slides_layout()}
			current={editor.slide?.layout}
			onPick={(part) => editor.setLayout(part)}
		/>
	</div>
	<button
		type="button"
		class="hover:bg-muted flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-sm"
		onclick={() => (themeOpen = true)}
	>
		<PaletteIcon class="size-4" />
		{m.slides_change_theme()}
	</button>
{/snippet}

{#if audience}
	<Audience channel={audience} initial={JSON.parse(content) as Deck} {media} />
{:else}
	<div bind:this={root} class="flex min-h-0 flex-1 flex-col gap-2">
		<SlidesMenu
			{editor}
			{menu}
			onComment={comments ? comment : undefined}
			bind:notes={notesOpen}
			onImage={() => pickPicture(null)}
			onPresent={present}
			onPresenter={() => {
				editor.stopEditing();
				mode = "presenter";
			}}
			onTheme={() => (themeOpen = true)}
			onFullscreen={fullscreen}
		/>
		{#if !readOnly}
			<Toolbar {editor} onImage={() => pickPicture(null)} onPresent={present} {idle} />
		{/if}

		<div class="flex min-h-0 flex-1 flex-col-reverse gap-2 sm:flex-row">
			<SlideRail {editor} {media} label={rawLabel} marked={new Set(commented.keys())} />
			<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
				<SlideCanvas
					{editor}
					{media}
					prompt={readOnly ? undefined : placeholderPrompt}
					label={rawLabel}
					onPicture={(id) => pickPicture(id)}
					onFiles={(files, at) => void addPictures(files, at)}
				/>
				<div class="shrink-0">
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
						aria-expanded={notesOpen}
						onclick={() => (notesOpen = !notesOpen)}
					>
						<StickyNoteIcon class="size-3.5" />
						{m.deck_speaker_notes()}
						<ChevronDownIcon class={cn("size-3 transition-transform", notesOpen && "rotate-180")} />
					</button>
					{#if notesOpen && editor.slide}
						<Textarea
							class="mt-1 h-24 text-sm"
							placeholder={m.deck_notes_placeholder()}
							value={editor.slide.notes}
							readonly={readOnly}
							onfocus={() => (notesFresh = true)}
							oninput={(event: Event) => {
								editor.setNotes((event.currentTarget as HTMLTextAreaElement).value, notesFresh);
								notesFresh = false;
							}}
						/>
					{/if}
				</div>
			</div>
		</div>

		<input
			bind:this={picker}
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={(event) => {
				const files = [...(event.currentTarget.files ?? [])];
				event.currentTarget.value = "";
				void addPictures(files);
			}}
		/>

		{#if mode === "present"}
			<Present
				deck={editor.deck}
				index={editor.current}
				{media}
				onnavigate={(to) => (editor.current = to)}
				onexit={stopPresenting}
				onfullscreen={fullscreen}
			/>
		{:else if mode === "presenter"}
			<Presenter deck={editor.deck} bind:index={editor.current} {media} onexit={() => (mode = "edit")} />
		{/if}
	</div>

	<ThemeDialog bind:open={themeOpen} {editor} />
{/if}
