<script lang="ts">
    import { onMount } from "svelte";
    import { getApiClient } from "$lib/api-client";
    import { readableFileSize } from "$lib/utils";

    type Props = {
        folderKey: string;
        parentPath?: string;
    };

    let { folderKey, parentPath }: Props = $props();

    let size: number | undefined = $state();
    let loading: boolean = $state(false);
    let error: boolean = $state(false);

    const api = getApiClient(fetch);

    onMount(async () => {
        loading = true;
        try {
            const folderId = folderKey.replace(/\/$/, "");
            const res = await api.storage.folders.size[":id"].$get({
                param: { id: folderId },
                query: { parent: parentPath },
            });

            if (res.ok) {
                const data = (await res.json()) as { size: number };
                size = data.size;
            } else {
                error = true;
            }
        } catch (err) {
            console.error("Failed to load folder size:", err);
            error = true;
        } finally {
            loading = false;
        }
    });
</script>

<p class="text-xs">
    {#if loading}
        <span class="text-muted-foreground">-</span>
    {:else if error}
        <span class="text-muted-foreground">-</span>
    {:else if size !== undefined}
        {readableFileSize(size) ?? "-"}
    {:else}
        <span class="text-muted-foreground">-</span>
    {/if}
</p>
