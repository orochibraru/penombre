<script lang="ts">
    import { TrashIcon } from "@lucide/svelte";
    import FileLayout from "$lib/components/file/layout.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { title } from "$lib/store/title";

    const { data } = $props();
    $title = "Trash";
</script>

<FileLayout data={data.files} />
