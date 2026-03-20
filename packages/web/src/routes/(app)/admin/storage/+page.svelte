<script lang="ts">
    import { title } from "$lib/store/title";
    import { readableFileSize } from "$lib/utils";
    import { onMount } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_admin_storage());
    });

    let { data } = $props();
</script>

<h2 class="text-lg font-medium">{m.storage_management()}</h2>
<p>Available Storage space: {readableFileSize(data.storageSize)}</p>
