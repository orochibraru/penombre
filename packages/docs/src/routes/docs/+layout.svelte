<script lang="ts">
	import { page } from "$app/state";
	import { config } from "$lib/config";
	import { docPages } from "$lib/docs-content";
	import SiteFooter from "$lib/site-footer.svelte";
	import SiteHeader from "$lib/site-header.svelte";

	const { children } = $props();

	const isActive = (href: string) => page.url.pathname === href;
	const navLinkClass = (href: string) =>
		`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
			isActive(href)
				? "bg-(--accent-soft) font-medium text-(--accent-strong)"
				: "text-(--text-muted) hover:bg-(--bg-card) hover:text-(--text)"
		}`;
</script>

<SiteHeader current="docs" />

<div class="mx-auto px-6 py-10 sm:py-12">
	<!-- ── Mobile guide picker ─────────────────────────────────────────
       The sidebar below is desktop-only (lg:block); without this, a
       visitor on a phone would have no way to jump between guides other
       than the prev/next links at the bottom of each page. A native
       <details> needs no JS and matches this site's otherwise
       build-time-only posture. -->
	<details class="mb-8 rounded-xl border border-(--border) bg-(--bg-card) lg:hidden">
		<summary
			class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium"
		>
			Guides
			<svg
				viewBox="0 0 20 20"
				class="size-4 text-(--text-subtle)"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<path d="M6 8l4 4 4-4" />
			</svg>
		</summary>
		<nav class="flex flex-col gap-0.5 border-t border-(--border) p-2">
			{#each docPages as doc (doc.slug)}
				<a href="/docs/{doc.slug}" class={navLinkClass(`/docs/${doc.slug}`)}>{doc.title}</a>
			{/each}
			{#if config.openapi}
				<a href="/docs/api" class={navLinkClass("/docs/api")}>API reference</a>
			{/if}
		</nav>
	</details>

	<div class="flex items-start gap-10">
		<!-- ── Sidebar ────────────────────────────────────────────────── -->
		<aside class="sticky top-24 hidden w-56 shrink-0 lg:block">
			<p class="mb-3 px-3 text-xs font-semibold tracking-wide text-(--text-subtle) uppercase">
				Guides
			</p>
			<nav class="flex flex-col gap-0.5 text-sm">
				{#each docPages as doc (doc.slug)}
					<a href="/docs/{doc.slug}" class={navLinkClass(`/docs/${doc.slug}`)}>{doc.title}</a>
				{/each}
			</nav>
			{#if config.openapi}
				<div class="my-4 border-t border-(--border)"></div>
				<a href="/docs/api" class={navLinkClass("/docs/api")}>API reference</a>
			{/if}
		</aside>

		<div class="min-w-0 flex-1">
			{@render children()}
		</div>
	</div>
</div>

<SiteFooter />
