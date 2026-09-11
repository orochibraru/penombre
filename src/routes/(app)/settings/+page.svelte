<script lang="ts">
	import { onMount } from "svelte";
	import LanguageDropdown from "$lib/components/language-dropdown.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_settings_general());
	});
</script>

<div class="flex flex-col gap-4">
    <Card.Root>
        <Card.Content>
            <LanguageDropdown />
        </Card.Content>
    </Card.Root>
</div>
