<script lang="ts">
	import {
		ArrowDownIcon,
		ArrowUpIcon,
		CopyIcon,
		MessageSquarePlusIcon,
		PlayIcon,
		PlusIcon,
		PresentationIcon,
		PrinterIcon,
		Trash2Icon,
	} from "@lucide/svelte";
	import { flushSync, type Snippet, tick, untrack } from "svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Menubar from "#lib/components/ui/menubar/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import {
		classTokens,
		deckTheme,
		isInverted,
		isPaginated,
		parseDeck,
		type Slide,
		setInverted,
		setPaginated,
		setSlideClass,
		setTheme,
		slideLooks,
		THEMES,
		type ThemeName,
		writeDeck,
	} from "#lib/deck/format.js";
	import { m } from "#lib/paraglide/messages.js";
	import { cn, toggleFullscreen } from "#lib/utils.js";
	import { page } from "$app/state";
	import Audience from "./deck/audience.svelte";
	import DeckPrint from "./deck/deck-print.svelte";
	import MarkdownToolbar from "./deck/markdown-toolbar.svelte";
	import Present from "./deck/present.svelte";
	import Presenter from "./deck/presenter.svelte";
	import SlideRail from "./deck/slide-rail.svelte";
	import SlideView from "./deck/slide-view.svelte";
	import type { Comments } from "./shell/comments.svelte.js";
	import type { EditorMenuContext } from "./shell/file-actions.js";

	/**
	 * A slide deck over a Markdown file in Marp's conventions: `---` between
	 * slides, front matter for the theme, comments for speaker notes and
	 * per-slide directives. The file opens in Marp, reveal.js or a text
	 * editor without conversion.
	 *
	 * `office` is a `.pptx`: slides are matched to the file by position and
	 * front matter has nowhere to go, so reordering, themes and pictures are
	 * not offered.
	 */
	let {
		content,
		onChange,
		office = page.data.office === true,
		readOnly = false,
		menu,
		comments,
	}: {
		content: string;
		onChange: (markdown: string) => void;
		office?: boolean;
		/** Showing only: slides, presenting and comments, no Markdown. */
		readOnly?: boolean;
		/** The shared File menu, first in the menu bar. */
		menu?: Snippet<[EditorMenuContext]>;
		/** Threads on slides: dotted in the rail, started from here. */
		comments?: Comments;
	} = $props();

	/** Set in the window the presenter view opens for the audience. */
	const audience = page.url.searchParams.get("audience");

	let deck = $state(untrack(() => parseDeck(content)));
	let current = $state(0);
	let mode = $state<"edit" | "present" | "presenter">("edit");
	let printing = $state(false);
	let root = $state<HTMLElement>();
	let textarea = $state<HTMLTextAreaElement | null>(null);

	const looks = $derived(slideLooks(deck));
	const theme = $derived(deckTheme(deck));
	const slide = $derived(deck.slides[current]);

	/** Each open thread's slide. */
	const commentedSlides = $derived(
		new Map(
			(comments?.unresolved ?? []).flatMap((thread) =>
				thread.root.anchor?.kind === "slide"
					? [[thread.root.anchor.index, thread.root.id] as const]
					: [],
			),
		),
	);
	const marked = $derived(new Set(commentedSlides.keys()));

	// On a slide with a thread, an open panel shows it.
	$effect(() => {
		const id = commentedSlides.get(current);
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
			const anchor = comments?.all.find((t) => t.root.id === request.id)?.root
				.anchor;
			if (anchor?.kind === "slide" && anchor.index < deck.slides.length) {
				current = anchor.index;
			}
		});
	});

	const lead = $derived(
		classTokens(looks[current]?.className ?? "").includes("lead"),
	);
	const THEME_LABELS: Record<ThemeName, () => string> = {
		default: m.deck_theme_default,
		gaia: m.deck_theme_gaia,
		uncover: m.deck_theme_uncover,
	};

	function commit() {
		onChange(writeDeck(deck));
	}

	function insertSlide(slide: Slide) {
		deck.slides.splice(current + 1, 0, slide);
		current += 1;
		commit();
	}

	function removeSlide() {
		if (deck.slides.length <= 1) {
			deck.slides = [{ body: "", notes: "", directives: {} }];
			current = 0;
		} else {
			deck.slides.splice(current, 1);
			current = Math.min(current, deck.slides.length - 1);
		}
		commit();
	}

	function moveSlide(from: number, to: number) {
		if (to < 0 || to >= deck.slides.length) {
			return;
		}
		const [moved] = deck.slides.splice(from, 1);
		if (moved) {
			deck.slides.splice(to, 0, moved);
		}
		current = to;
		commit();
	}

	function edit(change: () => void) {
		change();
		commit();
	}

	/** Whether this page asked for full screen, so leaving it ends the show. */
	let ownFullscreen = false;

	function present() {
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

	async function print() {
		printing = true;
		await tick();
		// A picture not decoded yet prints as a blank box.
		await Promise.all(
			[...document.querySelectorAll<HTMLImageElement>(".deck-print img")].map(
				(image) => image.decode().catch(() => undefined),
			),
		);
		window.print();
	}
</script>

<svelte:window
    onbeforeprint={() => flushSync(() => (printing = true))}
    onafterprint={() => (printing = false)}
/>
<svelte:document
    onfullscreenchange={() => {
        if (!document.fullscreenElement && ownFullscreen && mode === "present") {
            stopPresenting();
        }
    }}
/>

{#if audience}
    <Audience channel={audience} initial={deck} />
{:else}
    <div
        bind:this={root}
        class="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row"
    >
        <SlideRail
            {deck}
            {looks}
            {theme}
            bind:current
            reorder={!(office || readOnly)}
            onmove={moveSlide}
            {marked}
        />

        <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            <div class="flex flex-wrap items-center gap-2">
                <Menubar.Root class="w-fit max-w-full overflow-x-auto">
                    {#if menu}
                        {@render menu({ print: () => void print() })}
                    {:else}
                    <Menubar.Menu>
                        <Menubar.Trigger>{m.deck_menu_file()}</Menubar.Trigger>
                        <Menubar.Content>
                            <Menubar.Item onSelect={() => void print()}>
                                <PrinterIcon class="size-4" />
                                {m.deck_print()}
                            </Menubar.Item>
                        </Menubar.Content>
                    </Menubar.Menu>
                    {/if}
                    {#if !readOnly}
                    <Menubar.Menu>
                        <Menubar.Trigger>{m.menu_slide()}</Menubar.Trigger>
                        <Menubar.Content>
                            <Menubar.Item
                                onSelect={() =>
                                    insertSlide({
                                        body: `## ${m.deck_new_slide_title()}`,
                                        notes: "",
                                        directives: {},
                                    })}
                            >
                                <PlusIcon class="size-4" />
                                {m.deck_add_slide()}
                            </Menubar.Item>
                            <Menubar.Item
                                onSelect={() =>
                                    slide && insertSlide($state.snapshot(slide))}
                            >
                                <CopyIcon class="size-4" />
                                {m.deck_duplicate_slide()}
                            </Menubar.Item>
                            {#if !office}
                                <Menubar.Separator />
                                <Menubar.Item
                                    disabled={current === 0}
                                    onSelect={() => moveSlide(current, current - 1)}
                                >
                                    <ArrowUpIcon class="size-4" />
                                    {m.deck_move_up()}
                                </Menubar.Item>
                                <Menubar.Item
                                    disabled={current === deck.slides.length - 1}
                                    onSelect={() => moveSlide(current, current + 1)}
                                >
                                    <ArrowDownIcon class="size-4" />
                                    {m.deck_move_down()}
                                </Menubar.Item>
                                <Menubar.Separator />
                                <Menubar.CheckboxItem
                                    checked={lead}
                                    onCheckedChange={(on) =>
                                        edit(() => setSlideClass(deck, current, "lead", on))}
                                >
                                    {m.deck_title_slide()}
                                </Menubar.CheckboxItem>
                            {/if}
                            <Menubar.Separator />
                            <Menubar.Item variant="destructive" onSelect={removeSlide}>
                                <Trash2Icon class="size-4" />
                                {m.deck_delete_slide()}
                            </Menubar.Item>
                        </Menubar.Content>
                    </Menubar.Menu>
                    {/if}
                    <Menubar.Menu>
                        <Menubar.Trigger>{m.menu_view()}</Menubar.Trigger>
                        <Menubar.Content>
                            <Menubar.Item onSelect={present}>
                                <PlayIcon class="size-4" />
                                {m.deck_present()}
                            </Menubar.Item>
                            <Menubar.Item onSelect={() => (mode = "presenter")}>
                                <PresentationIcon class="size-4" />
                                {m.deck_presenter_view()}
                            </Menubar.Item>
                            {#if !office}
                                <Menubar.Separator />
                                <Menubar.CheckboxItem
                                    checked={isPaginated(deck)}
                                    onCheckedChange={(on) =>
                                        edit(() => setPaginated(deck, on))}
                                >
                                    {m.deck_page_numbers()}
                                </Menubar.CheckboxItem>
                            {/if}
                        </Menubar.Content>
                    </Menubar.Menu>
                    {#if !(office || readOnly)}
                        <Menubar.Menu>
                            <Menubar.Trigger>{m.theme()}</Menubar.Trigger>
                            <Menubar.Content>
                                <Menubar.RadioGroup
                                    value={theme}
                                    onValueChange={(name) =>
                                        edit(() =>
                                            setTheme(
                                                deck,
                                                THEMES.find((entry) => entry === name) ??
                                                    "default",
                                            ),
                                        )}
                                >
                                    {#each THEMES as name (name)}
                                        <Menubar.RadioItem value={name}>
                                            {THEME_LABELS[name]()}
                                        </Menubar.RadioItem>
                                    {/each}
                                </Menubar.RadioGroup>
                                <Menubar.Separator />
                                <Menubar.CheckboxItem
                                    checked={isInverted(deck)}
                                    onCheckedChange={(on) =>
                                        edit(() => setInverted(deck, on))}
                                >
                                    {m.theme_dark()}
                                </Menubar.CheckboxItem>
                            </Menubar.Content>
                        </Menubar.Menu>
                    {/if}
                </Menubar.Root>
                <div class="ms-auto flex items-center gap-2">
                    {#if comments}
                        <Button
                            variant="outline"
                            size="icon"
                            class="size-8"
                            aria-label={m.shell_add_comment()}
                            title={m.shell_add_comment()}
                            onclick={() =>
                                comments.start({ kind: "slide", index: current })}
                        >
                            <MessageSquarePlusIcon class="size-3.5" />
                        </Button>
                    {/if}
                    <Button
                        variant="outline"
                        size="icon"
                        class="size-8"
                        aria-label={m.deck_presenter_view()}
                        title={m.deck_presenter_view()}
                        onclick={() => (mode = "presenter")}
                    >
                        <PresentationIcon class="size-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onclick={present}>
                        <PlayIcon class="size-3.5" />
                        {m.deck_present()}
                    </Button>
                </div>
            </div>

            {#if slide}
                <div
                    class={cn(
                        "grid gap-3 lg:min-h-0 lg:flex-1",
                        !readOnly && "lg:grid-cols-2",
                    )}
                >
                    {#if !readOnly}
                    <div class="flex flex-col gap-2 lg:min-h-0">
                        <MarkdownToolbar {textarea} images={!office} />
                        <Textarea
                            bind:ref={textarea}
                            class="min-h-48 flex-1 resize-none font-mono text-xs"
                            spellcheck="false"
                            value={slide.body}
                            oninput={(event: Event) =>
                                edit(() => {
                                    slide.body = (event.currentTarget as HTMLTextAreaElement).value;
                                })}
                        />
                        <label class="flex flex-col gap-1">
                            <span class="text-muted-foreground text-xs">
                                {m.deck_speaker_notes()}
                            </span>
                            <Textarea
                                class="h-20 text-sm"
                                placeholder={m.deck_notes_placeholder()}
                                value={slide.notes}
                                oninput={(event: Event) =>
                                    edit(() => {
                                        slide.notes = (event.currentTarget as HTMLTextAreaElement).value;
                                    })}
                            />
                        </label>
                    </div>
                    {/if}
                    <div class="bg-muted/20 rounded-lg border p-2 lg:min-h-0">
                        <SlideView
                            {slide}
                            look={looks[current]}
                            {theme}
                            number={current + 1}
                            class="aspect-video w-full lg:aspect-auto lg:h-full"
                        />
                    </div>
                </div>
            {/if}
        </div>

        {#if mode === "present"}
            <Present
                {deck}
                {looks}
                {theme}
                index={current}
                onnavigate={(to) => (current = to)}
                onexit={stopPresenting}
                onfullscreen={fullscreen}
            />
        {:else if mode === "presenter"}
            <Presenter
                {deck}
                {looks}
                {theme}
                bind:index={current}
                onexit={() => (mode = "edit")}
            />
        {/if}
    </div>

    {#if printing}
        <DeckPrint {deck} {looks} {theme} />
    {/if}
{/if}
