<script lang="ts">
	import FileTable from '$lib/components/file-table.svelte';

	import { title } from '$lib/store/title';

	$title = 'My Drive';

	let { data } = $props();
</script>

<section>
	<FileTable
		data={data.files.list}
		count={data.files.count}
		paginationParams={{ page: 1, limit: 20 }}
	/>
</section>
