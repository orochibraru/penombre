<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_admin_dashboard());
    });
</script>

<h2 class="text-lg font-medium">{m.admin_dashboard()}</h2>
