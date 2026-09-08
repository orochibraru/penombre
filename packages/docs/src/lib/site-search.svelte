<script lang="ts">
	import { goto } from "$app/navigation";
	import type { SearchResult } from "$lib/search";

	let dialog: HTMLDialogElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let list: HTMLDivElement | undefined = $state();
	let query = $state("");
	let results: SearchResult[] = $state([]);
	let selected = $state(0);

	/**
	 * `$lib/docs-content` holds every guide's rendered HTML. The docs pages
	 * carry that weight already for their sidebar, but the landing page has
	 * no reason to — loading it only when someone actually opens the palette
	 * keeps `/` lean.
	 */
	let run: ((query: string) => SearchResult[]) | undefined;

	async function open() {
		if (!run) {
			const [{ search }, { docPages }] = await Promise.all([
				import("$lib/search"),
				import("$lib/docs-content"),
			]);
			run = (query: string) => search(docPages, query);
		}
		if (!dialog?.open) {
			dialog?.showModal();
		}
		input?.select();
	}

	function onInput() {
		results = run?.(query) ?? [];
		selected = 0;
	}

	function go(result: SearchResult | undefined) {
		if (!result) {
			return;
		}
		dialog?.close();
		void goto(result.href);
	}

	/** ↑/↓ move through results, Enter opens the selected one. Escape and the focus trap come free from `<dialog>` itself. */
	function onKeydown(event: KeyboardEvent) {
		if (
			event.key !== "ArrowDown" &&
			event.key !== "ArrowUp" &&
			event.key !== "Enter"
		) {
			return;
		}
		event.preventDefault();
		if (event.key === "Enter") {
			go(results[selected]);
			return;
		}
		const step = event.key === "ArrowDown" ? 1 : -1;
		selected = (selected + step + results.length) % Math.max(results.length, 1);
		list?.children[selected]?.scrollIntoView({ block: "nearest" });
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			void open();
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<button
	type="button"
	onclick={open}
	class="flex items-center gap-2 rounded-full border border-(--border) px-3 py-1.5 text-(--text-subtle) transition-colors hover:border-(--border-hover) hover:text-(--text)"
	aria-label="Search the docs"
>
	<svg viewBox="0 0 20 20" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
		<circle cx="9" cy="9" r="5.5" />
		<path d="M13.5 13.5 17 17" />
	</svg>
	<span class="hidden sm:inline text-xs">Search</span>
	<kbd class="hidden font-sans text-[11px] text-(--text-subtle) sm:inline">⌘K</kbd>
</button>

<!-- Native <dialog>: Escape, the focus trap and inerting the page behind it
     are the platform's job, not this component's. A click on the element
     itself (rather than any child) is a click on the backdrop. -->
<dialog
	bind:this={dialog}
	onclick={(event) => event.target === dialog && dialog?.close()}
	onkeydown={onKeydown}
	class="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-(--border) bg-(--bg-raised) p-0 text-(--text) shadow-(--shadow) backdrop:bg-black/40 backdrop:backdrop-blur-sm"
>
	<div class="flex items-center gap-3 border-b border-(--border) px-4">
		<svg viewBox="0 0 20 20" class="size-4 shrink-0 text-(--text-subtle)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<circle cx="9" cy="9" r="5.5" />
			<path d="M13.5 13.5 17 17" />
		</svg>
		<!-- Deliberately not type="search": Blink's native "Escape clears the
		     field" behaviour on that type swallows the key, so the dialog never
		     gets its close request and stays open. Verified live. -->
		<input
			bind:this={input}
			bind:value={query}
			oninput={onInput}
			type="text"
			placeholder="Search the docs…"
			aria-label="Search the docs"
			class="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-(--text-subtle)"
		/>
	</div>

	{#if query.trim().length >= 2}
		<div bind:this={list} class="max-h-[60vh] overflow-y-auto p-2">
			{#each results as result, i (result.href + result.snippet)}
				<a
					href={result.href}
					onclick={(event) => {
						event.preventDefault();
						go(result);
					}}
					onmouseenter={() => (selected = i)}
					aria-current={i === selected}
					class="block rounded-lg px-3 py-2.5 transition-colors {i === selected ? 'bg-(--accent-soft)' : ''}"
				>
					<p class="flex items-baseline gap-2 text-sm font-medium">
						<span class={i === selected ? 'text-(--accent-strong)' : ''}>{result.heading}</span>
						{#if result.heading !== result.title}
							<span class="text-xs font-normal text-(--text-subtle)">{result.title}</span>
						{/if}
					</p>
					{#if result.snippet}
						<p class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-(--text-muted)">
							{#if result.matchStart >= 0}
								{result.snippet.slice(0, result.matchStart)}<mark
									class="bg-transparent font-semibold text-(--text)"
									>{result.snippet.slice(result.matchStart, result.matchStart + result.matchLength)}</mark
								>{result.snippet.slice(result.matchStart + result.matchLength)}
							{:else}
								{result.snippet}
							{/if}
						</p>
					{/if}
				</a>
			{:else}
				<p class="px-3 py-6 text-center text-sm text-(--text-subtle)">
					No matches for “{query.trim()}”.
				</p>
			{/each}
		</div>
	{/if}
</dialog>
