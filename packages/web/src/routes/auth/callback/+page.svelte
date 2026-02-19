<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import { m } from "$lib/paraglide/messages.js";
    import { resolve } from "$app/paths";

    // This page exists only to load cookies in the browser
    // so the sign in flow works properly

    onMount(() => {
        goto(resolve("/"), { replaceState: true, invalidateAll: true });
    });
</script>

<div class="flex h-screen flex-col items-center justify-center gap-2">
    <p class="text-lg font-medium">
        {m.authenticating_redirect()}
    </p>
    <Spinner size={8} />
</div>
