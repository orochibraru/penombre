<script lang="ts">
    import { page } from "$app/state";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";

    type Props = {
        confirmDeleteOpen: boolean;
        deletingItem: boolean;
        checkedItems: Record<string, string | false>;
        handleDeleteObject: () => void;
    };

    let {
        confirmDeleteOpen = $bindable(false),
        deletingItem = $bindable(false),
        checkedItems = $bindable(),
        handleDeleteObject,
    }: Props = $props();

    // Get display names from checked items
    let itemNames = $derived(
        Object.values(checkedItems).filter((name): name is string => !!name),
    );

    const isTrash = $derived(page.url.pathname.startsWith("/trash"));
</script>

<ResponsiveDialog
    bind:open={confirmDeleteOpen}
    bind:loading={deletingItem}
    title="Are you absolutely sure?"
    description={isTrash
        ? "This action cannot be undone. This will permanently delete the following items from your storage device."
        : "This will move the following items to the Trash."}
    submitLabel="Continue"
    loadingLabel="Deleting..."
    submitVariant="destructive"
    onsubmit={handleDeleteObject}
>
    <div class="prose">
        <ul>
            {#each itemNames as name}
                <li class="text-foreground">{name}</li>
            {/each}
        </ul>
    </div>
</ResponsiveDialog>
