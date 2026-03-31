<script lang="ts">
    import "../app.css";

    import { pwaInfo } from "virtual:pwa-info";
    import { ModeWatcher } from "mode-watcher";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { onNavigate } from "$app/navigation";
    import TopLoadingbar from "$lib/components/layout/top-loading-bar.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index";
    import { title } from "$lib/store/title";

    let { children, data } = $props();
    let webManifestLink = $state<string>("");

    onNavigate((navigation) => {
        if (!browser) return;

        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });

    $effect(() => {
        webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : "";
    });
</script>

<ModeWatcher />

<svelte:head>
    <title>{data.config.appName} - {$title ?? "Home"}</title>
    {@html webManifestLink}
</svelte:head>

<TopLoadingbar />
{@render children()}

<Toaster position="bottom-right" richColors closeButton />
