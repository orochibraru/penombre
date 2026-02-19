<script lang="ts">
    import { FolderPlusIcon, UploadIcon } from "@lucide/svelte";
    import type { ObjectList } from "$lib/api";
    import FileWrapper from "$lib/components/file/wrapper.svelte";
    import RenameDialog from "$lib/components/layout/dialogs/rename-dialog.svelte";
    import PageError from "$lib/components/layout/page-error.svelte";
    import * as ContextMenu from "$lib/components/ui/context-menu/index";
    import { uploadDialogOpen, newFolderDialogOpen } from "$lib/store/upload";

    type UserPreferences = {
        layout?: "grid" | "list";
        sortColumn?: "name" | "size" | "updatedAt" | null;
        sortDirection?: "asc" | "desc";
    };

    type Props = {
        data: { data: ObjectList | undefined; err: unknown };
        preferences?: UserPreferences;
    };

    const { data: res, preferences }: Props = $props();

    function handleUpload() {
        $uploadDialogOpen = true;
    }

    function handleCreateFolder() {
        $newFolderDialogOpen = true;
    }
</script>

<ContextMenu.Root>
    <ContextMenu.Trigger class="w-full min-h-full">
        <section>
            {#if !res.data}
                <PageError />
            {:else}
                <FileWrapper data={res.data} {preferences} />
            {/if}
        </section>
    </ContextMenu.Trigger>
    <ContextMenu.Content>
        <ContextMenu.Item onclick={handleUpload}>
            <UploadIcon class="h-4 w-4" />
            Upload files
        </ContextMenu.Item>
        <ContextMenu.Item onclick={handleCreateFolder}>
            <FolderPlusIcon class="h-4 w-4" />
            Create folder
        </ContextMenu.Item>
    </ContextMenu.Content>
</ContextMenu.Root>

<RenameDialog />
