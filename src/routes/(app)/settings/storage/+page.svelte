<script lang="ts">
	import { onMount } from "svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_settings_storage());
	});
</script>
