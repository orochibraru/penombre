<script lang="ts">
    import FileLayout from "$lib/components/file/layout.svelte";
    import { title } from "$lib/store/title";

    const { data } = $props();

    $title = "Starred";
</script>

<FileLayout data={data.files} preferences={data.preferences} />
