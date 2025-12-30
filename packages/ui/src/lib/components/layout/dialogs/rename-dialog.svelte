<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidateAll } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient } from "$lib/api-client";
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { itemAction } from "$lib/store/actions";

    let error: string = $state("");
    let newName: string = $state("");
    let loading: boolean = $state(false);
    let isFolder: boolean = $state(false);

    async function handleRename() {
        loading = true;

        if (!$itemAction.item) {
            throw new Error("No item loaded in rename action.");
        }

        let finalName = newName;
        if (isFolder) {
            finalName = `${newName}/`;
        }

        const promise = getApiClient(fetch).storage.objects.item[":item"]
            .$put({
                param: { item: encodeURIComponent($itemAction.item.key) },
                query: { folder: page.params.path },
                json: {
                    contentType:
                        $itemAction.item.metadata.contentType ||
                        "application/octet-stream",
                    key: finalName,
                },
            })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to rename");
                }
                $itemAction.open = false;
                invalidateAll();
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
            if ($itemAction.item.key.endsWith("/")) {
                isFolder = true;
                newName = $itemAction.item.key.slice(0, -1);
            } else {
                newName = $itemAction.item.key;
            }
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title
                >Rename {$itemAction.item?.key ?? "this file"}</Dialog.Title
            >
            <Dialog.Description
                >This will change the name of this item.</Dialog.Description
            >
        </Dialog.Header>
        <form
            onsubmit={async (e) => {
                e.preventDefault();
                await handleRename();
            }}
            style="display: contents;"
        >
            <div class="flex flex-col gap-1">
                <Input
                    required
                    type="text"
                    bind:value={newName}
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
            <Dialog.Footer>
                <Button
                    onclick={() => ($itemAction.open = false)}
                    variant="outline"
                    type="button"
                >
                    Cancel
                </Button>
                <Button bind:loading type="submit">Rename</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
