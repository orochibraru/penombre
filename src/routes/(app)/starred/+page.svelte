<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import tableData from '$lib/data/fake';
	import { title } from '$lib/store/title';

	$title = 'Starred';
</script>

<div>
	<DataTable data={tableData} />
</div>
