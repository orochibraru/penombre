<script lang="ts">
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import * as m from "$lib/paraglide/messages.js";
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-3">
    <h1 class="text-2xl font-bold">{m.being_redirected()}</h1>
    <Spinner size={8} />
</div>
