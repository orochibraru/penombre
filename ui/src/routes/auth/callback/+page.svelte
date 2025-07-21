<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import Spinner from "$lib/components/ui/Spinner.svelte";

  // This page exists only to load cookies in the browser
  // so the sign in flow works properly

  onMount(() => {
    goto(`${base}/`, { replaceState: true, invalidateAll: true });
  });
</script>

<div class="flex flex-col gap-2 h-screen items-center justify-center">
  <p class="text-lg font-medium">Authenticating, you'll soon be redirected.</p>
  <Spinner size={8} />
</div>
