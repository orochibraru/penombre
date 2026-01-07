<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient } from "$lib/api-client";
    import Button, {
        buttonVariants,
    } from "$lib/components/ui/button/button.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { MediaQuery } from "svelte/reactivity";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import { cn } from "$lib/utils";

    type Props = {
        open: boolean;
    };

    let { open = $bindable(false) }: Props = $props();

    const defaultFolderName = "New Folder";

    let newFolderError: string = $state("");
    let newFolderName: string = $state(defaultFolderName);
    let newFolderLoading: boolean = $state(false);

    async function handleNewFolder() {
        newFolderLoading = true;

        const promise = getApiClient(fetch)
            .storage.folders.$post({
                json: {
                    name: newFolderName,
                    parent: page.params.path,
                },
            })
            .then(async (res) => {
                newFolderLoading = false;
                if (!res.ok) {
                    console.error(await res.text());
                    throw new Error("Failed to create folder");
                }

                await invalidateAll();
                open = false;
                newFolderName = defaultFolderName;
            });

        return toast.promise(promise, {
            loading: "Creating folder",
            success: "Folder created",
            error: "Failed to create folder",
        });
    }

    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

{#snippet form()}
    <form
        onsubmit={async (e) => {
            e.preventDefault();
            await handleNewFolder();
        }}
        style="display: contents;"
    >
        <div class="flex flex-col gap-1">
            <Input
                required
                type="text"
                bind:value={newFolderName}
                placeholder="Folder name"
                class="w-full"
                aria-invalid={newFolderError !== ""}
            />
            {#if newFolderError}
                <p class="text-xs text-red-600">
                    {newFolderError}
                </p>
            {/if}
        </div>

        <Button bind:loading={newFolderLoading} type="submit">Create</Button>
    </form>
{/snippet}

{#if isDesktop.current}
    <Dialog.Root bind:open>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>Create a new folder</Dialog.Title>
                <Dialog.Description>
                    This will create a new folder in the current directory.
                </Dialog.Description>
            </Dialog.Header>
            {@render form()}
            <Dialog.Footer>
                <Dialog.Close
                    class={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                    Cancel
                </Dialog.Close>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <Drawer.Root bind:open>
        <Drawer.Content class="z-50">
            <Drawer.Header>
                <Drawer.Title class="text-lg">Create a new folder</Drawer.Title>
                <Drawer.Description class="text-sm text-muted-foreground">
                    This will create a new folder in the current directory.
                </Drawer.Description>
            </Drawer.Header>
            <div class="p-4 flex flex-col gap-2">
                {@render form()}
            </div>

            <Drawer.Footer>
                <Drawer.Close class={buttonVariants({ variant: "outline" })}>
                    Cancel
                </Drawer.Close>
            </Drawer.Footer>
        </Drawer.Content>
    </Drawer.Root>
{/if}
