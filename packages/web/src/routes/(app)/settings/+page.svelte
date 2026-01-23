<script lang="ts">
    import LanguageDropdown from "$lib/components/language-dropdown.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Settings - General");
    });
</script>

<LanguageDropdown />
