<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import tableData from '$lib/data/fake';
	import { title } from '$lib/store/title';

	$title = 'My Drive';
</script>

<section>
	<DataTable title="Recent" data={tableData} showPagination={false} />
</section>
<section>
	<DataTable title="Starred" data={tableData} showPagination={false} />
</section>
