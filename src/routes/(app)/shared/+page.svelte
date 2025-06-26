<script lang="ts">
	import DataTable from '$lib/components/file-table.svelte';
	import { title } from '$lib/store/title';

	const { data } = $props();
	$title = 'Shared';
</script>

<div>
	<DataTable data={[]} count={0} />
</div>
