<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient } from "$lib/api";
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";

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

        const promise = getApiClient({ url: page.url })
            .POST("/api/storage/folders", {
                body: {
                    name: newFolderName,
                    parent: page.params.path,
                },
            })
            .then(async ({ error }) => {
                newFolderLoading = false;
                if (error) {
                    console.error(error);
                    throw error;
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
</script>

<Dialog.Root bind:open>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Create a new folder</Dialog.Title>
            <Dialog.Description>
                This will create a new folder in the current directory.
            </Dialog.Description>
        </Dialog.Header>
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
            <Dialog.Footer>
                <Button
                    onclick={() => (open = false)}
                    variant="outline"
                    type="button">Cancel</Button
                >
                <Button bind:loading={newFolderLoading} type="submit"
                    >Create</Button
                >
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
