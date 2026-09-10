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

<div class="flex max-w-2xl flex-col gap-6">
    <div>
        <h2 class="text-xl font-semibold tracking-tight">
            {m.settings_nav_general()}
        </h2>
        <p class="text-muted-foreground text-sm">
            {m.settings_general_description()}
        </p>
    </div>

    <Card.Root>
        <Card.Content>
            <LanguageDropdown />
        </Card.Content>
    </Card.Root>
</div>
