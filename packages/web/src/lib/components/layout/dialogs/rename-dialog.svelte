<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { api } from "$lib/api";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import { Input } from "$lib/components/ui/input";
    import { itemAction } from "$lib/store/actions";
    import * as m from "$lib/paraglide/messages.js";

    let error: string = $state("");
    let newName: string = $state("");
    let loading: boolean = $state(false);
    let isFolder: boolean = $derived($itemAction?.item?.type === "folder");
    let inputRef: HTMLInputElement = $state(null!);

    async function handleRename() {
        loading = true;

        if (!$itemAction.item) {
            throw new Error("No item loaded in rename action.");
        }

        const api_ = api;

        if (isFolder) {
            const promise = api_
                .PUT("/api/v1/storage/folder/{path}", {
                    params: { path: { path: $itemAction.item.key } },
                    body: {
                        name: newName,
                        parentFolderId: page.params.path,
                    },
                })
                .then(({ error: fetchError }) => {
                    if (fetchError) {
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
                loading: m.toast_renaming_item(),
                success: m.toast_item_renamed(),
                error: m.toast_rename_item_error(),
            });
        }

        const promise = api_
            .PUT("/api/v1/storage/file/{id}", {
                params: { path: { id: $itemAction.item.key } },
                body: {
                    contentType:
                        $itemAction.item.metadata.contentType ||
                        "application/octet-stream",
                    key: newName,
                },
            })
            .then(({ error: fetchError }) => {
                if (fetchError) {
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
            loading: m.toast_renaming_item(),
            success: m.toast_item_renamed(),
            error: m.toast_rename_item_error(),
        });
    }

    let open: boolean = $state(false);

    // Sync store → local state
    $effect(() => {
        open = $itemAction?.open ?? false;
    });

    // Sync local state → store (when dialog is dismissed via Escape/overlay)
    $effect(() => {
        if (!open && $itemAction?.open) {
            $itemAction.open = false;
        }
    });

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
    title={m.rename_title({
        name: $itemAction?.item?.metadata?.name ?? "this file",
    })}
    description={m.rename_description()}
    submitLabel={m.rename()}
    loadingLabel={m.renaming()}
    onsubmit={handleRename}
>
    <div class="flex flex-col gap-1">
        <Input
            required
            type="text"
            bind:value={newName}
            bind:ref={inputRef}
            placeholder={m.new_name_placeholder()}
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
