<script lang="ts">
	import FileLayout from "$lib/components/file/layout.svelte";
	import { title } from "$lib/store/title";

	let { data } = $props();

	$effect(() => {
		$title = data.title ?? "My Drive";
	});
</script>

<FileLayout data={data.files} />
