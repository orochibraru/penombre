<script lang="ts">
	import { config } from "$lib/config";
	import SiteSearch from "$lib/site-search.svelte";
	import ThemeToggle from "$lib/theme-toggle.svelte";

	const { current }: { current?: "home" | "docs" } = $props();
</script>

<header class="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 backdrop-blur">
	<div class="mx-auto flex items-center justify-between px-6 py-4">
		<a href="/" class="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
			<span
				class="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-(--accent) to-(--accent-strong) text-xs font-bold text-white"
				>{config.logo}</span
			>
			<span>{config.name}</span>
		</a>

		<nav class="flex items-center gap-4 text-sm sm:gap-6">
			{#if config.landing}
				<a
					href="/#features"
					class="hidden text-(--text-muted) transition-colors hover:text-(--text) sm:inline">Features</a
				>
			{/if}
			<a
				href="/docs"
				class="transition-colors hover:text-(--text) {current === 'docs' ? 'text-(--text)' : 'text-(--text-muted)'}"
				>Docs</a
			>
			<SiteSearch />
			{#if config.repoUrl}
				<a
					href={config.repoUrl}
					target="_blank"
					rel="noreferrer"
					class="flex items-center gap-1.5 rounded-full border border-(--border) px-3.5 py-1.5 text-(--text-muted) transition-colors hover:border-(--border-hover) hover:text-(--text)"
				>
					<svg viewBox="0 0 16 16" class="size-3.5 fill-current" aria-hidden="true">
						<path
							d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
            0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
            -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
            -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82
            a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
            0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
            0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
						/>
					</svg>
					<span class="hidden sm:inline">Source</span>
				</a>
			{/if}
			<ThemeToggle />
		</nav>
	</div>
</header>
