<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Account - Security");
    });

    const { data } = $props();
</script>

<h2 class="text-lg font-medium">Password Management</h2>
