<script lang="ts">
    import LanguageDropdown from "$lib/components/language-dropdown.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_settings_general());
    });
</script>

<LanguageDropdown />
