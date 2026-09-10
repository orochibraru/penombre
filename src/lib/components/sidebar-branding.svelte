<script lang="ts">
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import * as Sidebar from "$lib/components/ui/sidebar/index";
	import type { AppConfig } from "$lib/server/config";

	const config: AppConfig = $derived(page.data.config);
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!">
            {#snippet child({ props })}
                <a href={resolve("/")} {...props}>
                    <img
                        src="/logo.svg"
                        alt={`${config.appName} logo`}
                        class="w-10 h-10"
                    />
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
