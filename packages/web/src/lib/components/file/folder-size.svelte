<script lang="ts">
    import { onMount } from "svelte";
    import { readableFileSize } from "$lib/utils";
    import { api } from "$lib/api";

    type Props = {
        folderKey: string;
        parentPath?: string;
    };

    let { folderKey, parentPath }: Props = $props();

    let size: number | undefined = $state();
    let loading: boolean = $state(false);
    let error: boolean = $state(false);

    onMount(async () => {
        loading = true;
        try {
            const folderId = folderKey.replace(/\/$/, "");
            const res = await api.GET("/api/v1/storage/folder/{path}/size", {
                params: {
                    path: { path: folderId },
                    query: { parent: parentPath },
                },
            });

            if (res.data?.data !== undefined) {
                size = res.data.data;
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
