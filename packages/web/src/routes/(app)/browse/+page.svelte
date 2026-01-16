<script lang="ts">
    import FileLayout from "$lib/components/file/layout.svelte";
    import { title } from "$lib/store/title";

    $title = "My Drive";

    let { data } = $props();
</script>

<FileLayout data={data.files} preferences={data.preferences} />
