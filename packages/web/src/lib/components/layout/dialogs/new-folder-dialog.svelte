<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient } from "$lib/api-client";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import { Input } from "$lib/components/ui/input";

    type Props = {
        open: boolean;
    };

    let { open = $bindable(false) }: Props = $props();

    const defaultFolderName = "New Folder";

    let newFolderError: string = $state("");
    let newFolderName: string = $state(defaultFolderName);
    let loading: boolean = $state(false);
    let inputRef: HTMLInputElement = $state(null!);

    // Select text when dialog opens
    $effect(() => {
        if (open && inputRef) {
            setTimeout(() => inputRef.select(), 0);
        }
    });

    async function handleNewFolder(e: SubmitEvent) {
        e.preventDefault();
        loading = true;

        const promise = getApiClient(fetch)
            .storage.folders.$post({
                json: {
                    name: newFolderName,
                    parent: page.params.path,
                },
            })
            .then(async (res) => {
                loading = false;
                if (!res.ok) {
                    console.error(await res.text());
                    throw new Error("Failed to create folder");
                }

                await invalidate("app:files");
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

<ResponsiveDialog
    bind:open
    bind:loading
    title="Create a new folder"
    description="This will create a new folder in the current directory."
    submitLabel="Create"
    loadingLabel="Creating..."
    form={{ onsubmit: handleNewFolder }}
>
    <div class="flex flex-col gap-1">
        <Input
            required
            type="text"
            bind:value={newFolderName}
            bind:ref={inputRef}
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
</ResponsiveDialog>
