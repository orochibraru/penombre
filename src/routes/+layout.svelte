<script lang="ts">
	import '../app.css';
	import TopLoadingbar from '$lib/components/layout/top-loading-bar.svelte';
	import { title } from '$lib/store/title';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head>
	<title>Opendrive - {$title}</title>
</svelte:head>

<ModeWatcher />

<TopLoadingbar />
{@render children()}

<Toaster position="top-right" richColors closeButton />
