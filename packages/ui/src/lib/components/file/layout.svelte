<script lang="ts">
    import type { ApiResponse, ObjectList } from "$lib/api";
    import FileWrapper from "$lib/components/file/wrapper.svelte";
    import RenameDialog from "$lib/components/layout/dialogs/rename-dialog.svelte";
    import PageError from "$lib/components/layout/page-error.svelte";

    type Props = {
        data: ApiResponse<ObjectList>;
    };

    const { data: res }: Props = $props();
</script>

<section>
    {#if !res.data}
        <PageError />
    {:else}
        <FileWrapper data={res.data} />
    {/if}
</section>

<RenameDialog />
