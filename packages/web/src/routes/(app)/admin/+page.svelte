<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Admin - Dashboard");
    });
</script>

<h2 class="text-lg font-medium">Admin Dashboard</h2>
