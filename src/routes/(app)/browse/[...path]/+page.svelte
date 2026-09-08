<script lang="ts">
	import FileLayout from "$lib/components/file/layout.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	let { data } = $props();

	$effect(() => {
		$title = data.title ?? m.nav_my_drive();
	});
</script>

<FileLayout data={data.files} preferences={data.preferences} />
