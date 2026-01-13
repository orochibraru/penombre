<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { getApiClient } from "$lib/api-client";
    import Button, {
        buttonVariants,
    } from "$lib/components/ui/button/button.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Input } from "$lib/components/ui/input";
    import { itemAction } from "$lib/store/actions";
    import { MediaQuery } from "svelte/reactivity";
    import * as Drawer from "$lib/components/ui/drawer";
    import type { Snippet } from "svelte";

    let error: string = $state("");
    let newName: string = $state("");
    let loading: boolean = $state(false);
    let isFolder: boolean = $derived($itemAction?.item?.type === "folder");

    async function handleRename() {
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
        }
    });

    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

{#snippet dialogFooter()}
    <Dialog.Footer>
        <Dialog.Close
            type="button"
            class={buttonVariants({ variant: "outline" })}
        >
            Cancel
        </Dialog.Close>
        <Button bind:loading type="submit">Rename</Button>
    </Dialog.Footer>
{/snippet}

{#snippet drawerFooter()}
    <Drawer.Footer>
        <Drawer.Close
            type="button"
            class={buttonVariants({ variant: "outline" })}
        >
            Cancel
        </Drawer.Close>
        <Button bind:loading type="submit">Rename</Button>
    </Drawer.Footer>
{/snippet}

{#snippet Form(children: Snippet)}
    <div class="px-5">
        <form
            onsubmit={async (e) => {
                e.preventDefault();
                await handleRename();
            }}
            style="display: contents;"
        >
            <div class="flex flex-col gap-1 mb-3">
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
            {#if children}{@render children()}{/if}
        </form>
    </div>
{/snippet}

{#if isDesktop.current}
    <Dialog.Root bind:open>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>
                    Rename {$itemAction.item?.metadata.name ?? "this file"}
                </Dialog.Title>
                <Dialog.Description>
                    This will change the name of this item.
                </Dialog.Description>
            </Dialog.Header>
            {@render Form(dialogFooter)}
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <Drawer.Root bind:open>
        <Drawer.Content>
            <Drawer.Header>
                <Drawer.Title>
                    Rename {$itemAction.item?.metadata.name ?? "this file"}
                </Drawer.Title>
                <Drawer.Description>
                    This will change the name of this item.
                </Drawer.Description>
            </Drawer.Header>
            {@render Form(drawerFooter)}
        </Drawer.Content>
    </Drawer.Root>
{/if}
