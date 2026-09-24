<script lang="ts">
	import Logo from "#lib/components/logo.svelte";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import type { AppConfig } from "#lib/server/config.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	const config: AppConfig = $derived(page.data.config);
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!">
            {#snippet child({ props })}
                <a href={resolve("/(app)")} {...props}>
                    <Logo label={`${config.appName} logo`} class="size-7" />
                    <span
                        class="from-primary via-primary to-brand-2 bg-linear-to-r bg-clip-text text-base font-semibold text-transparent"
                    >
                        {config.appName}
                    </span>
                </a>
            {/snippet}
        </Sidebar.MenuButton>
    </Sidebar.MenuItem>
</Sidebar.Menu>
