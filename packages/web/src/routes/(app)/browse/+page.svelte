<script lang="ts">
    import FileLayout from "$lib/components/file/layout.svelte";
    import { title } from "$lib/store/title";
    import * as m from "$lib/paraglide/messages.js";

    $title = m.nav_my_drive();

    let { data } = $props();
</script>

<FileLayout data={data.files} preferences={data.preferences} />
