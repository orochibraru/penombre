<script lang="ts">
	import FileTable from '$lib/components/file-table.svelte';

	import { title } from '$lib/store/title';

	let { data } = $props();

	$effect(() => {
		$title = data.folders[data.folders.length - 1];
	});
</script>

<section>
	<FileTable data={data.files} />
</section>
