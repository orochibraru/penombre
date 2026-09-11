<script lang="ts">
	import { resolve } from "$app/paths";
	import LanguageDropdown from "$lib/components/language-dropdown.svelte";
	import * as Card from "$lib/components/ui/card/index";

	const { children, data } = $props();
</script>

<!--
  One centred column over the aurora, not a 50/50 split with a stock photo.
  The form sits in a card with a near-opaque surface (`data-auth-card` in
  app.css) — the default card is translucent, and a password field read
  through a blurred gradient is not a password field anybody can read.
-->
<div
    class="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10"
>
    <a href={resolve("/")} class="flex items-center gap-2 font-medium">
        <img
            src="/logo.svg"
            alt={`${data.config.appName} logo`}
            class="text-primary size-8"
        />
        <span
            class="from-primary to-brand-2 bg-linear-to-r bg-clip-text text-lg text-transparent"
        >
            {data.config.appName}
        </span>
    </a>

    <Card.Root data-auth-card class="w-full max-w-lg py-0">
        <Card.Content class="p-6 sm:p-8">
            {@render children()}
        </Card.Content>
    </Card.Root>

    <div class="w-44">
        <LanguageDropdown compact />
    </div>
</div>
