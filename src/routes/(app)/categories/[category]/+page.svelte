<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import tableData from '$lib/data/fake';
	import { title } from '$lib/store/title';
	import { capitalizeFirstLetter } from '$lib/utils';

	const { data } = $props();

	$effect(() => {
		$title = capitalizeFirstLetter(data.category);
	});
</script>

<div>
	<DataTable data={tableData} />
</div>
