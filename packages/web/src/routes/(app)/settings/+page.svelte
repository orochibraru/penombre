<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Settings - General");
    });
</script>
