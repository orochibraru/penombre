<script lang="ts">
	import '../app.css';
	import TopLoadingbar from '$lib/components/top-loading-bar.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-french-toast';

	let { children } = $props();
</script>

<TopLoadingbar />
<ModeWatcher />
{@render children?.()}
<Toaster position="top-right" />
