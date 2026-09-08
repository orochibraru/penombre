<script lang="ts">
	import { config } from "$lib/config";
	import SiteFooter from "$lib/site-footer.svelte";
	import SiteHeader from "$lib/site-header.svelte";

	const landing = config.landing;

	// The headline is one string in the config so it reads there as the
	// sentence it renders as; the accent is a substring of it that gets the
	// gradient. Not found (or not set) leaves the headline plain.
	const [beforeAccent, afterAccent] = landing?.accent
		? landing.headline.split(landing.accent)
		: [landing?.headline ?? "", undefined];
</script>

<svelte:head>
	<title>{config.name} — {config.description}</title>
</svelte:head>

<SiteHeader current="home" />

{#if landing}
	<main>
		<!-- ── Hero ─────────────────────────────────────────────────────── -->
		<section class="relative overflow-hidden px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
			<div
				class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-140 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,var(--accent-soft),transparent)]"
			></div>

			{#if landing.badge}
				<p
					class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-(--border) px-3.5 py-1 text-xs font-medium text-(--text-muted)"
				>
					<span class="size-1.5 rounded-full bg-(--accent)"></span>
					{landing.badge}
				</p>
			{/if}

			<h1 class="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
				{beforeAccent}{#if afterAccent !== undefined}<span
						class="bg-linear-to-r from-(--accent-strong) to-(--accent) bg-clip-text text-transparent"
						>{landing.accent}</span
					>{afterAccent}{/if}
			</h1>

			<p class="mx-auto mt-6 max-w-xl text-lg text-(--text-muted) text-balance">
				{landing.subheadline}
			</p>

			<div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a
					href="/docs"
					class="rounded-full bg-(--accent) px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--accent-strong)"
					>Get started</a
				>
				{#if config.repoUrl}
					<a
						href={config.repoUrl}
						target="_blank"
						rel="noreferrer"
						class="rounded-full border border-(--border) px-6 py-2.5 text-sm font-semibold transition-colors hover:border-(--border-hover)"
						>View source</a
					>
				{/if}
			</div>

			{#if landing.snippet}
				<div class="mx-auto mt-14 max-w-4xl text-left">
					<div
						class="flex items-center gap-2 rounded-t-lg border border-b-0 border-(--border) bg-(--bg-raised) px-4 py-2.5"
					>
						<span class="size-2.5 rounded-full bg-[#ff5f57]"></span>
						<span class="size-2.5 rounded-full bg-[#febc2e]"></span>
						<span class="size-2.5 rounded-full bg-[#28c840]"></span>
						<span class="ml-2 text-xs text-(--text-subtle)">{landing.snippet.caption}</span>
					</div>
					<pre
						class="overflow-x-auto rounded-b-lg border border-(--border) bg-(--code-bg) px-4 py-4 text-left text-[13px] leading-relaxed"><code
							class="text-(--text-muted)">{landing.snippet.command}</code
						></pre>
				</div>
			{/if}
		</section>

		<!-- ── Features ─────────────────────────────────────────────────── -->
		{#if landing.features.length > 0}
			<section id="features" class="mx-auto max-w-6xl px-6 pb-24">
				<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{#each landing.features as feature (feature.title)}
						<div
							class="rounded-2xl border border-(--border) bg-(--bg-card) p-6 transition-colors hover:border-(--border-hover)"
						>
							<h3 class="mb-2 text-[15px] font-semibold">{feature.title}</h3>
							<p class="text-sm leading-relaxed text-(--text-muted)">{feature.body}</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- ── Stack strip ──────────────────────────────────────────────── -->
		{#if landing.stack}
			<section class="border-y border-(--border) bg-(--bg-raised) px-6 py-14">
				<div class="mx-auto max-w-4xl text-center">
					<h2 class="text-2xl font-bold tracking-tight">{landing.stack.title}</h2>
					<p class="mx-auto mt-3 max-w-xl text-(--text-muted)">{landing.stack.body}</p>
					<div
						class="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-(--text-subtle)"
					>
						{#each landing.stack.items as item (item)}
							<span>{item}</span>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- ── CTA ──────────────────────────────────────────────────────── -->
		<section class="px-6 py-20 text-center">
			<h2 class="text-2xl font-bold tracking-tight">{landing.cta.title}</h2>
			<p class="mx-auto mt-3 max-w-md text-(--text-muted)">{landing.cta.body}</p>
			<a
				href="/docs"
				class="mt-8 inline-block rounded-full bg-(--accent) px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--accent-strong)"
				>{landing.cta.label}</a
			>
		</section>
	</main>

	<SiteFooter />
{/if}
