<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_settings_storage());
    });
</script>
