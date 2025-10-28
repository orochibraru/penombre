<script lang="ts">
	import DataTable from '$lib/components/file/wrapper.svelte';
	import { title } from '$lib/store/title';

	$title = 'Shared';
</script>

<div>
	<DataTable data={{ count: 0, list: [] }} />
</div>
