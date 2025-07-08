<script lang="ts">
	import FileTable from '$lib/components/file-table.svelte';
	import { title } from '$lib/store/title';

	let { data } = $props();

	$effect(() => {
		$title = data.title;
	});
</script>

<section>
	<FileTable data={data.files} />
</section>
