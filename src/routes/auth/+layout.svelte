<script lang="ts">
	import AuthBackdrop from "#lib/components/auth-backdrop.svelte";
	import LanguageDropdown from "#lib/components/language-dropdown.svelte";
	import Logo from "#lib/components/logo.svelte";
	import * as Card from "#lib/components/ui/card/index.js";
	import { resolve } from "$app/paths";

	const { children, data } = $props();
</script>

<!--
  One centred column over the aurora, not a 50/50 split with a stock photo.
  The form sits in a card with a near-opaque surface (`data-auth-card` in
  app.css) — the default card is translucent, and a password field read
  through a blurred gradient is not a password field anybody can read.
-->
<AuthBackdrop />
<div
    class="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10"
>
    <a
        href={resolve("/(app)")}
        class="flex flex-col items-center gap-3 font-semibold tracking-tight"
    >
        <Logo label={`${data.config.appName} logo`} class="size-14" />
        <span
            class="from-primary to-brand-2 bg-linear-to-r bg-clip-text text-2xl text-transparent"
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
