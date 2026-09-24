<script lang="ts">
	import FileLayout from "#lib/components/file/layout.svelte";
	import LibraryScan from "#lib/components/scan/library-scan.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";

	$title = m.nav_my_drive();

	let { data } = $props();
</script>

<div class="flex flex-col gap-4">
    <LibraryScan />
    <FileLayout data={data.files} preferences={data.preferences} />
</div>
