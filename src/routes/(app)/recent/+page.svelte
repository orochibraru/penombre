<script lang="ts">
	import DataTable from '$lib/components/file-table.svelte';
	import { title } from '$lib/store/title';

	const { data } = $props();

	$title = 'Recent';
</script>

<div>
	<DataTable data={data.files.list} count={data.files.count} showPagination={false} />
</div>
