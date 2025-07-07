<script lang="ts">
	import DataTable from '$lib/components/file-table.svelte';
	import { title } from '$lib/store/title';
	import { capitalizeFirstLetter } from '$lib/utils';

	const { data } = $props();

	$effect(() => {
		$title = capitalizeFirstLetter(data.category);
	});
</script>

<div>
	<DataTable data={data.files} />
</div>
