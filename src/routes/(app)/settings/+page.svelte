<script lang="ts">
	import { onMount } from "svelte";
	import LanguageDropdown from "$lib/components/language-dropdown.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_settings_general());
	});
</script>

<LanguageDropdown />
