<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import data from './data';
</script>

<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
	<DataTable {data} />
</div>
