<script lang="ts">
	import {
		ChevronLeftIcon,
		ChevronRightIcon,
		PlayIcon,
		PlusIcon,
		Trash2Icon,
		XIcon,
	} from "@lucide/svelte";
	import { untrack } from "svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { parseSlides, toDeck } from "$lib/documents";
	import { m } from "$lib/paraglide/messages.js";
	import { cn } from "$lib/utils";

	/**
	 * A slide deck over a Markdown file, slides separated by `---`.
	 *
	 * The same convention every Markdown deck tool uses, so the file opens in
	 * reveal.js, Marp or a plain text editor without conversion.
	 */
	let {
		content,
		onChange,
	}: { content: string; onChange: (markdown: string) => void } = $props();

	let slides = $state<string[]>(untrack(() => parseSlides(content)));
	let current = $state(0);
	let presenting = $state(false);

	function commit() {
		onChange(toDeck(slides));
	}

	function addSlide() {
		slides.splice(current + 1, 0, "## New slide\n");
		current += 1;
		commit();
	}

	function removeSlide() {
		if (slides.length <= 1) {
			slides = [""];
			current = 0;
		} else {
			slides.splice(current, 1);
			current = Math.min(current, slides.length - 1);
		}
		commit();
	}

	const go = (delta: number) => {
		current = Math.min(Math.max(0, current + delta), slides.length - 1);
	};

	/**
	 * Enough Markdown to render a slide: headings, bold, italic, list items.
	 * A full parser is a dependency this does not need — a deck is headings
	 * and bullets, and anything else survives as plain text.
	 */
	function renderSlide(markdown: string): string {
		const escaped = markdown
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		return escaped
			.split("\n")
			.map((line) => {
				const heading = /^(#{1,6})\s+(.*)$/.exec(line);
				if (heading) {
					const level = heading[1]?.length ?? 1;
					return `<h${level}>${inline(heading[2] ?? "")}</h${level}>`;
				}
				const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
				if (bullet) {
					return `<li>${inline(bullet[1] ?? "")}</li>`;
				}
				return line.trim() ? `<p>${inline(line)}</p>` : "";
			})
			.join("\n")
			.replace(/(<li>[\s\S]*?<\/li>)(?!\n<li>)/g, "<ul>$1</ul>");
	}

	function inline(text: string): string {
		return text
			.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
			.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
			.replace(/`(.+?)`/g, "<code>$1</code>");
	}

	function onPresentKey(event: KeyboardEvent) {
		if (event.key === "Escape") {
			presenting = false;
		} else if (event.key === "ArrowRight" || event.key === " ") {
			go(1);
		} else if (event.key === "ArrowLeft") {
			go(-1);
		}
	}
</script>

<svelte:window onkeydown={presenting ? onPresentKey : undefined} />

{#if presenting}
    <!-- Full-viewport, above the app chrome. Escape or the close button
         returns to editing; arrows move between slides. -->
    <div
        class="bg-background fixed inset-0 z-50 flex flex-col"
        role="region"
        aria-label={m.deck_presenting()}
    >
        <div
            class="prose-slide flex flex-1 flex-col items-center justify-center gap-4 px-[8vw] text-center"
        >
            {@html renderSlide(slides[current] ?? "")}
        </div>
        <div class="flex items-center justify-between gap-3 p-4">
            <Button variant="ghost" size="icon" onclick={() => go(-1)}>
                <ChevronLeftIcon />
            </Button>
            <span class="text-muted-foreground text-xs tabular-nums">
                {current + 1} / {slides.length}
            </span>
            <div class="flex items-center gap-2">
                <Button variant="ghost" size="icon" onclick={() => go(1)}>
                    <ChevronRightIcon />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onclick={() => (presenting = false)}
                >
                    <XIcon />
                </Button>
            </div>
        </div>
    </div>
{/if}

<div class="flex min-h-0 flex-1 gap-3">
    <!-- Slide rail -->
    <ul class="flex w-40 shrink-0 flex-col gap-2 overflow-y-auto pe-1">
        {#each slides as slide, index (index)}
            <li>
                <button
                    type="button"
                    class={cn(
                        "hover:border-primary/60 w-full overflow-hidden rounded-lg border p-2 text-left transition-colors",
                        index === current && "border-primary bg-primary/5",
                    )}
                    onclick={() => (current = index)}
                >
                    <span
                        class="text-muted-foreground mb-1 block text-[10px] tabular-nums"
                    >
                        {index + 1}
                    </span>
                    <span class="line-clamp-3 text-xs break-words">
                        {slide.replace(/[#*`]/g, "").trim() || m.deck_empty()}
                    </span>
                </button>
            </li>
        {/each}
    </ul>

    <div class="flex min-h-0 flex-1 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onclick={addSlide}>
                <PlusIcon class="size-3.5" />
                {m.deck_add_slide()}
            </Button>
            <Button variant="outline" size="sm" onclick={removeSlide}>
                <Trash2Icon class="size-3.5" />
                {m.deck_delete_slide()}
            </Button>
            <Button
                variant="outline"
                size="sm"
                class="ms-auto"
                onclick={() => (presenting = true)}
            >
                <PlayIcon class="size-3.5" />
                {m.deck_present()}
            </Button>
        </div>

        <div class="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
            <Textarea
                class="h-full min-h-48 font-mono text-xs"
                value={slides[current] ?? ""}
                oninput={(e: Event) => {
                    slides[current] = (e.currentTarget as HTMLTextAreaElement)
                        .value;
                    commit();
                }}
            />
            <div
                class="prose-slide bg-muted/20 min-h-48 overflow-auto rounded-lg border p-5"
            >
                {@html renderSlide(slides[current] ?? "")}
            </div>
        </div>
    </div>
</div>

<style>
    /* Slide typography, shared by the live preview and present mode. */
    .prose-slide :global(h1) {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.15;
    }
    .prose-slide :global(h2) {
        font-size: 1.5rem;
        font-weight: 600;
    }
    .prose-slide :global(p) {
        margin-block: 0.5rem;
    }
    .prose-slide :global(ul) {
        list-style: disc;
        padding-inline-start: 1.5rem;
        text-align: start;
    }
    .prose-slide :global(code) {
        font-family: var(--font-mono, monospace);
        font-size: 0.9em;
    }
</style>
