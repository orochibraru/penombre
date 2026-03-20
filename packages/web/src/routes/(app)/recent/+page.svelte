<script lang="ts">
    import FileLayout from "$lib/components/file/layout.svelte";
    import { title } from "$lib/store/title";
    import * as m from "$lib/paraglide/messages.js";

    const { data } = $props();

    $title = m.nav_recent();
</script>

<FileLayout data={data.files} preferences={data.preferences} />
