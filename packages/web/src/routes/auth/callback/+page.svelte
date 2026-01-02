<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import { route } from "$lib/ROUTES";

    // This page exists only to load cookies in the browser
    // so the sign in flow works properly

    onMount(() => {
        goto(route("/"), { replaceState: true, invalidateAll: true });
    });
</script>

<div class="flex h-screen flex-col items-center justify-center gap-2">
    <p class="text-lg font-medium">
        Authenticating, you'll soon be redirected.
    </p>
    <Spinner size={8} />
</div>
