<script lang="ts">
    import { page } from "$app/state";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import * as Drawer from "$lib/components/ui/drawer";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import { MediaQuery } from "svelte/reactivity";

    type Props = {
        confirmDeleteOpen: boolean;
        deletingItem: boolean;
        checkedItems: Record<string, boolean>;
        handleDeleteObject: () => void;
    };

    let {
        confirmDeleteOpen = $bindable(false),
        deletingItem = $bindable(false),
        checkedItems = $bindable(),
        handleDeleteObject,
    }: Props = $props();

    const isTrash = $derived(page.url.pathname.startsWith("/trash"));
    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

{#if isDesktop}
    <AlertDialog.Root bind:open={confirmDeleteOpen}>
        <AlertDialog.Content class="max-h-[70%] overflow-y-auto pb-16">
            <AlertDialog.Header>
                <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description>
                    {#if isTrash}
                        This action cannot be undone. This will permanently
                        delete the following items from your storage device.
                    {:else}
                        This will move the following items to the Trash.
                    {/if}
                </AlertDialog.Description>
            </AlertDialog.Header>
            <div class="prose">
                <ul>
                    {#each Object.keys(checkedItems) as item}
                        <li class="text-foreground">{item}</li>
                    {/each}
                </ul>
            </div>
            <AlertDialog.Footer class="fixed bottom-5 w-full px-10">
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action
                    onclick={() => handleDeleteObject()}
                    disabled={deletingItem}
                    class="bg-red-600"
                >
                    {#if deletingItem}
                        <Spinner />
                    {:else}
                        Continue
                    {/if}
                </AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{:else}
    <Drawer.Root bind:open={confirmDeleteOpen}>
        <Drawer.Content>
            <Drawer.Header>
                <Drawer.Title>Are you sure absolutely sure?</Drawer.Title>
                <Drawer.Description>
                    {#if isTrash}
                        This action cannot be undone. This will permanently
                        delete the following items from your storage device.
                    {:else}
                        This will move the following items to the Trash.
                    {/if}
                </Drawer.Description>
            </Drawer.Header>
            <div class="prose">
                <ul>
                    {#each Object.keys(checkedItems) as item}
                        <li class="text-foreground">{item}</li>
                    {/each}
                </ul>
            </div>
            <Drawer.Footer>
                <Button
                    loading={deletingItem}
                    onclick={() => handleDeleteObject()}
                >
                    Continue
                </Button>
                <Drawer.Close>Cancel</Drawer.Close>
            </Drawer.Footer>
        </Drawer.Content>
    </Drawer.Root>
{/if}
