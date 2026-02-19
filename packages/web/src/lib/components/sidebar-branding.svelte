<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { resolve } from "$app/paths";
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!">
            {#snippet child({ props })}
                <a href={resolve("/")} {...props}>
                    <img
                        src="/logo.svg"
                        alt="Opendrive Logo"
                        class="w-10 h-10"
                    />
                    <span class="text-base font-semibold"> Opendrive. </span>
                </a>
            {/snippet}
        </Sidebar.MenuButton>
    </Sidebar.MenuItem>
</Sidebar.Menu>
