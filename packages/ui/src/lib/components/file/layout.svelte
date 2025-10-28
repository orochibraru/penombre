<script lang="ts">
	import type { ObjectRequest } from '$lib/api/helpers/storage';
	import FileWrapper from '$lib/components/file/wrapper.svelte';

	import PageError from '$lib/components/layout/page-error.svelte';

	type Props = {
		data: ObjectRequest;
	};

	const { data }: Props = $props();
</script>

<section>
	{#await data}
		<FileWrapper
			data={{
				list: [],
				count: 0
			}}
			loading
		/>
	{:then res}
		{#if !res.data}
			<PageError />
		{:else}
			<FileWrapper data={res.data} />
		{/if}
	{:catch}
		<PageError />
	{/await}
</section>
