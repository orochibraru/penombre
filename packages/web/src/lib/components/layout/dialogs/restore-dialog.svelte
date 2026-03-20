<script lang="ts">
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import * as m from "$lib/paraglide/messages.js";

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
    title={m.confirm_restore_title()}
    description={m.confirm_restore_description()}
    submitLabel={m.continue()}
    loadingLabel={m.restoring()}
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
