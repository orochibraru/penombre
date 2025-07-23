<script lang="ts">
	import DataTable from '$lib/components/file-table.svelte';
	import { title } from '$lib/store/title';

	const { data } = $props();
	$title = 'Starred';
</script>

<div>
	<DataTable data={{ count: 0, list: [] }} />
</div>
