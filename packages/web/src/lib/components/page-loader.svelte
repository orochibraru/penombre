<script lang="ts">
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import * as m from "$lib/paraglide/messages.js";
</script>

<div class="flex w-full flex-col items-center justify-center gap-2">
    <Spinner size={8} />
    <p class="text-sm">{m.loading()}</p>
</div>
