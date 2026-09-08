<script lang="ts">
	import { config } from "$lib/config";

	const { data } = $props();
</script>

<svelte:head>
	<title>{data.doc.title} — {config.name} docs</title>
</svelte:head>

<div class="flex items-start gap-10">
  <article class="prose-doc min-w-0 flex-1">
    {@html data.doc.html}
  </article>

  <!-- ── On this page ────────────────────────────────────────────────
       Skipped entirely for a page with no h2/h3 of its own rather than
       rendering an empty, oddly-bordered box. -->
  {#if data.doc.toc.length > 0}
    <aside class="sticky top-24 hidden w-48 shrink-0 xl:block">
      <p class="mb-3 px-1 text-xs font-semibold tracking-wide text-(--text-subtle) uppercase">
        On this page
      </p>
      <nav class="flex flex-col gap-1 text-sm">
        {#each data.doc.toc as entry (entry.id)}
          <a
            href="#{entry.id}"
            class="rounded px-1 py-0.5 text-(--text-muted) transition-colors hover:text-(--text) {entry.depth === 3 ? 'pl-4' : ''}"
          >{entry.text}</a>
        {/each}
      </nav>
    </aside>
  {/if}
</div>

{#if data.prev || data.next}
  <nav class="mt-12 flex items-stretch gap-4 border-t border-(--border) pt-8">
    {#if data.prev}
      <a
        href="/docs/{data.prev.slug}"
        class="group flex-1 rounded-xl border border-(--border) p-4 transition-colors hover:border-(--border-hover)"
      >
        <p class="text-xs text-(--text-subtle)">← Previous</p>
        <p class="mt-1 text-sm font-medium transition-colors group-hover:text-(--accent-strong)">{data.prev.title}</p>
      </a>
    {:else}
      <div class="flex-1"></div>
    {/if}
    {#if data.next}
      <a
        href="/docs/{data.next.slug}"
        class="group flex-1 rounded-xl border border-(--border) p-4 text-right transition-colors hover:border-(--border-hover)"
      >
        <p class="text-xs text-(--text-subtle)">Next →</p>
        <p class="mt-1 text-sm font-medium transition-colors group-hover:text-(--accent-strong)">{data.next.title}</p>
      </a>
    {:else}
      <div class="flex-1"></div>
    {/if}
  </nav>
{/if}
