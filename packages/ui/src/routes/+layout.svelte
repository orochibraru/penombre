<script lang="ts">
    import "../app.css";

    import { ModeWatcher } from "mode-watcher";
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { onNavigate } from "$app/navigation";
    import TopLoadingbar from "$lib/components/layout/top-loading-bar.svelte";
    import { Toaster } from "$lib/components/ui/sonner/index";

    let { children } = $props();

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

    onMount(() => {
        if (!browser) return;

        // Hide the loader once the app is mounted with a smooth fade out
        const loader = document.getElementById("svelte-loader");
        if (loader) {
            // Ensure opacity starts at 1, then transition to 0
            loader.style.opacity = "1";
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    loader.style.opacity = "0";
                    setTimeout(() => {
                        loader.style.display = "none";
                    }, 300);
                });
            });
        }
    });
</script>

<ModeWatcher />

<TopLoadingbar />
{@render children()}

<Toaster position="bottom-right" richColors closeButton />
