<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';
	import TopLoadingbar from '$lib/components/layout/top-loading-bar.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import { title } from '$lib/store/title';

	let { children } = $props();
</script>

<svelte:head>
	<title>Opendrive - {$title}</title>
</svelte:head>

<ModeWatcher />

<TopLoadingbar />
{@render children()}

<Toaster position="bottom-right" richColors closeButton />
