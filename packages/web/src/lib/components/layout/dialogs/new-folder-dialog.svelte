<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { api } from "$lib/api";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import { Input } from "$lib/components/ui/input";
    import * as m from "$lib/paraglide/messages.js";

    type Props = {
        open: boolean;
    };

    let { open = $bindable(false) }: Props = $props();

    const defaultFolderName = m.new_folder_default();

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

        const promise = api
            .POST("/api/v1/storage/folder", {
                body: {
                    name: newFolderName,
                    parent: page.params.path,
                },
            })
            .then(async ({ error: fetchError }) => {
                loading = false;
                if (fetchError) {
                    console.error(fetchError);
                    throw new Error("Failed to create folder");
                }

                await invalidate("app:files");
                open = false;
                newFolderName = defaultFolderName;
            });

        return toast.promise(promise, {
            loading: m.toast_creating_folder(),
            success: m.toast_folder_created(),
            error: m.toast_create_folder_error(),
        });
    }
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    title={m.create_folder_title()}
    description={m.create_folder_description()}
    submitLabel={m.create()}
    loadingLabel={m.creating()}
    form={{ onsubmit: handleNewFolder }}
>
    <div class="flex flex-col gap-1">
        <Input
            required
            type="text"
            bind:value={newFolderName}
            bind:ref={inputRef}
            placeholder={m.folder_name_placeholder()}
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
