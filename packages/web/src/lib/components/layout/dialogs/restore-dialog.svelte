<script lang="ts">
    import { page } from "$app/state";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import * as Drawer from "$lib/components/ui/drawer";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import { MediaQuery } from "svelte/reactivity";

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

    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

{#if isDesktop.current}
    <AlertDialog.Root bind:open={confirmRestoreOpen}>
        <AlertDialog.Content class="max-h-[70%] overflow-y-auto pb-16">
            <AlertDialog.Header>
                <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description>
                    This will permanently restore the following items to their
                    original location.
                </AlertDialog.Description>
            </AlertDialog.Header>
            <div class="prose">
                <ul>
                    {#each itemNames as name}
                        <li class="text-foreground">{name}</li>
                    {/each}
                </ul>
            </div>
            <AlertDialog.Footer class="fixed bottom-5 w-full px-10">
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action
                    onclick={() => handleRestoreObject()}
                    disabled={restoringItem}
                    class="bg-red-600"
                >
                    {#if restoringItem}
                        <Spinner />
                    {:else}
                        Continue
                    {/if}
                </AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{:else}
    <Drawer.Root bind:open={confirmRestoreOpen}>
        <Drawer.Content>
            <Drawer.Header>
                <Drawer.Title>Are you sure absolutely sure?</Drawer.Title>
                <Drawer.Description>
                    This will permanently restore the following items to their
                    original location.
                </Drawer.Description>
            </Drawer.Header>
            <div class="prose">
                <ul>
                    {#each itemNames as name}
                        <li class="text-foreground">{name}</li>
                    {/each}
                </ul>
            </div>
            <Drawer.Footer>
                <Button
                    loading={restoringItem}
                    onclick={() => handleRestoreObject()}
                >
                    Continue
                </Button>
                <Drawer.Close>Cancel</Drawer.Close>
            </Drawer.Footer>
        </Drawer.Content>
    </Drawer.Root>
{/if}
