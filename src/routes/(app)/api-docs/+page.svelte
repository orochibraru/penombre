<script lang="ts">
	import "swagger-ui-dist/swagger-ui.css";
	import { onMount } from "svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	$title = m.nav_api();

	let container: HTMLDivElement | undefined = $state();

	onMount(() => {
		// Imported client-side only: swagger-ui-bundle touches
		// `window`/`document` at call time, which would crash SSR otherwise.
		void (async () => {
			const { default: SwaggerUIBundle } = await import(
				"swagger-ui-dist/swagger-ui-bundle.js"
			);
			SwaggerUIBundle({
				domNode: container,
				deepLinking: true,
				presets: [SwaggerUIBundle.presets.apis],
				url: "/api/v1/openapi.json",
			});
		})();
	});
</script>

<!-- Swagger UI ships its own light styling that doesn't follow the app's theme
     tokens, so it's wrapped in a light card to read correctly in either theme. -->
<div class="min-h-[60vh] overflow-auto rounded-xl bg-white p-2">
    <div bind:this={container}></div>
</div>
