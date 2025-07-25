<script lang="ts">
	import type { ObjectRequest } from '$lib/api/helpers/storage';
	import FileTable from '$lib/components/file-table.svelte';

	import PageError from '$lib/components/layout/page-error.svelte';
	import PageLoader from '$lib/components/page-loader.svelte';

	type Props = {
		data: ObjectRequest;
	};

	const { data }: Props = $props();
</script>

<section>
	{#await data}
		<PageLoader />
	{:then res}
		{#if !res.data}
			<PageError />
		{:else}
			<FileTable data={res.data} />
		{/if}
	{:catch}
		<PageError />
	{/await}
</section>
