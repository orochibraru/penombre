<script lang="ts">
	import '../app.css';
	import TopLoadingbar from '$lib/components/top-loading-bar.svelte';
	import { title } from '$lib/store/title';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-french-toast';

	let { children } = $props();
</script>

<svelte:head>
	<title>Opendrive - {$title}</title>
</svelte:head>

<TopLoadingbar />
<ModeWatcher />
{@render children?.()}
<Toaster position="top-right" />
