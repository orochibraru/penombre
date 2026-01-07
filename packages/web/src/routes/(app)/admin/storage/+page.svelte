<script lang="ts">
    import { title } from "$lib/store/title";
    import { readableFileSize } from "$lib/utils";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Admin - Storage");
    });

    let { data } = $props();
</script>

<h2 class="text-lg font-medium">Storage Management</h2>
<p>Available Storage space: {readableFileSize(data.storageSize)}</p>
