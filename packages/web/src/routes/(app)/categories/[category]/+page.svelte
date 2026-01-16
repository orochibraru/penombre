<script lang="ts">
    import FileLayout from "$lib/components/file/layout.svelte";
    import { title } from "$lib/store/title";
    import { capitalizeFirstLetter } from "$lib/utils";

    const { data } = $props();

    $effect(() => {
        $title = capitalizeFirstLetter(data.category ?? "Unknown Category");
    });
</script>

<FileLayout data={data.files} preferences={data.preferences} />
