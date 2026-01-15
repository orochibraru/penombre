<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient } from "$lib/api-client";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import { Input } from "$lib/components/ui/input";
    import { itemAction } from "$lib/store/actions";

    let error: string = $state("");
    let newName: string = $state("");
    let loading: boolean = $state(false);
    let isFolder: boolean = $derived($itemAction?.item?.type === "folder");
    let inputRef: HTMLInputElement = $state(null!);

    async function handleRename(e: SubmitEvent) {
        e.preventDefault();
        loading = true;

        if (!$itemAction.item) {
            throw new Error("No item loaded in rename action.");
        }

        const api = getApiClient(fetch);

        if (isFolder) {
            const promise = api.storage.folders.folder[":id"]
                .$put({
                    param: { id: $itemAction.item.key },
                    json: {
                        name: newName,
                        parentFolderId: page.params.path,
                    },
                })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error("Failed to rename");
                    }
                    $itemAction.open = false;
                    invalidate("app:files");
                })
                .catch((e) => {
                    throw e;
                })
                .finally(() => {
                    loading = false;
                });

            return toast.promise(promise, {
                loading: "Renaming item",
                success: "Item renamed",
                error: "Failed to rename item",
            });
        }

        const promise = api.storage.objects.item[":item"]
            .$put({
                param: { item: $itemAction.item.key },
                query: { folder: page.params.path },
                json: {
                    contentType:
                        $itemAction.item.metadata.contentType ||
                        "application/octet-stream",
                    key: newName,
                },
            })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to rename");
                }
                $itemAction.open = false;
                invalidate("app:files");
            })
            .catch((e) => {
                throw e;
            })
            .finally(() => {
                loading = false;
            });

        return toast.promise(promise, {
            loading: "Renaming item",
            success: "Item renamed",
            error: "Failed to rename item",
        });
    }

    let open = $derived($itemAction?.open || false);

    $effect(() => {
        if ($itemAction?.item) {
            if (!$itemAction.item.metadata) {
                throw new Error("Item metadata is missing");
            }
            if (!$itemAction.item.metadata.name) {
                throw new Error("Item name is missing");
            }
            newName = $itemAction.item.metadata.name;
            // Select text after it's set (exclude extension for files)
            setTimeout(() => {
                if (!inputRef) return;
                if (isFolder) {
                    inputRef.select();
                } else {
                    const lastDot = newName.lastIndexOf(".");
                    const end = lastDot > 0 ? lastDot : newName.length;
                    inputRef.setSelectionRange(0, end);
                    inputRef.focus();
                }
            }, 0);
        }
    });
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    title="Rename {$itemAction?.item?.metadata?.name ?? 'this file'}"
    description="This will change the name of this item."
    submitLabel="Rename"
    loadingLabel="Renaming..."
    form={{ onsubmit: handleRename }}
>
    <div class="flex flex-col gap-1">
        <Input
            required
            type="text"
            bind:value={newName}
            bind:ref={inputRef}
            placeholder="New name"
            class="w-full"
            aria-invalid={error !== ""}
        />
        {#if error}
            <p class="text-xs text-red-600">
                {error}
            </p>
        {/if}
    </div>
</ResponsiveDialog>
