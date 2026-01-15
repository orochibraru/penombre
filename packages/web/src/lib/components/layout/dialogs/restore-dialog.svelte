<script lang="ts">
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";

    type Props = {
        confirmRestoreOpen: boolean;
        restoringItem: boolean;
        checkedItems: Record<string, string | false>;
        handleRestoreObject: () => void;
    };

    let {
        confirmRestoreOpen = $bindable(false),
        restoringItem = $bindable(false),
        checkedItems = $bindable(),
        handleRestoreObject,
    }: Props = $props();

    // Get display names from checked items
    let itemNames = $derived(
        Object.values(checkedItems).filter((name): name is string => !!name),
    );

    function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        handleRestoreObject();
    }
</script>

<ResponsiveDialog
    bind:open={confirmRestoreOpen}
    bind:loading={restoringItem}
    title="Are you absolutely sure?"
    description="This will permanently restore the following items to their original location."
    submitLabel="Continue"
    loadingLabel="Restoring..."
    form={{ onsubmit: handleSubmit }}
>
    <div class="prose">
        <ul>
            {#each itemNames as name}
                <li class="text-foreground">{name}</li>
            {/each}
        </ul>
    </div>
</ResponsiveDialog>
