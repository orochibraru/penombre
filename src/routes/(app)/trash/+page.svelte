<script lang="ts">
	import FileLayout from "$lib/components/file/layout.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	const { data } = $props();
	$title = m.nav_trash();
</script>

<FileLayout data={data.files} preferences={data.preferences} />
