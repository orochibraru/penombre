<script lang="ts">
	import "swagger-ui-dist/swagger-ui.css";
	import { onMount } from "svelte";
	import { config } from "$lib/config";

	let container: HTMLDivElement | undefined = $state();

	onMount(() => {
		// Imported client-side only : swagger-ui-bundle touches
		// `window`/`document` at call time, which would crash SvelteKit's
		// prerender pass otherwise.
		void (async () => {
			const { default: SwaggerUIBundle } = await import(
				"swagger-ui-dist/swagger-ui-bundle.js"
			);
			SwaggerUIBundle({
				dom_id: undefined,
				domNode: container,
				presets: [SwaggerUIBundle.presets.apis],
				url: config.openapi ?? "/openapi.json",
			});
		})();
	});
</script>

<svelte:head>
	<title>API reference — {config.name} docs</title>
</svelte:head>

<div class="max-w-3xl">
	<h1 class="mb-2 text-2xl font-bold tracking-tight">API reference</h1>
	<p class="mb-6 text-sm leading-relaxed text-(--text-muted)">
		Rendered from the OpenAPI spec checked in at <code>static{config.openapi ?? "/openapi.json"}</code
		>, a snapshot taken at build time — "Try it out" here has no live instance behind it unless you
		point it at one of your own.
	</p>
</div>

<!-- Swagger UI ships its own light styling that doesn't follow this site's
     theme tokens, so it's wrapped in a light card to read correctly in
     either theme. -->
<div class="min-h-[60vh] overflow-auto rounded-2xl bg-white p-2">
	<div bind:this={container}></div>
</div>
