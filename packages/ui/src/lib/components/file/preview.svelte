<script lang="ts">
	import type { ObjectItem } from '$lib/api';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { isCodeItem } from '$lib/file-utils';
	import { getProxiedObjectUrl } from '$lib/url';

	type Props = {
		item: ObjectItem;
	};

	let { item }: Props = $props();
</script>

<div class="flex w-full items-center justify-between">
	{#await getProxiedObjectUrl(item)}
		<Spinner />
	{:then url}
		{#if item.contentType?.includes('application/pdf')}
			<embed src={url} title={item.key} class="overflow-hidden" width="100%" height="200px" />
		{:else if isCodeItem(item.key)}
			<embed src={url} title={item.key} class="overflow-hidden" width="100%" height="200px" />
		{:else}
			<img src={url} alt={item.key} class="mx-auto max-h-[200px] min-w-[200px] rounded-xl" />
		{/if}
	{/await}
</div>
