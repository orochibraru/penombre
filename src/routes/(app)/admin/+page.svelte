<script lang="ts">
	import { onMount } from "svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_admin_dashboard());
	});
</script>

<h2 class="text-lg font-medium">{m.admin_dashboard()}</h2>
