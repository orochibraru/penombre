<script lang="ts">
	import "../app.css";
	import { config } from "$lib/config";

	const { children } = $props();
</script>

<svelte:head>
	<meta name="description" content={config.description} />
</svelte:head>

{@render children()}
