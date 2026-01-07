<script lang="ts">
    import { HardDriveIcon } from "@lucide/svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { route } from "$lib/ROUTES";
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!">
            {#snippet child({ props })}
                <a href={route("/")} {...props}>
                    <HardDriveIcon class="size-5!" />
                    <span class="text-base font-semibold"> Opendrive. </span>
                </a>
            {/snippet}
        </Sidebar.MenuButton>
    </Sidebar.MenuItem>
</Sidebar.Menu>
