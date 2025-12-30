<script lang="ts">
    import type { ObjectList } from "$lib/api-client";
    import FileWrapper from "$lib/components/file/wrapper.svelte";
    import RenameDialog from "$lib/components/layout/dialogs/rename-dialog.svelte";
    import PageError from "$lib/components/layout/page-error.svelte";

    type Props = {
        data: { data: ObjectList | undefined; err: unknown };
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
