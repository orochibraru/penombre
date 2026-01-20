<script lang="ts">
    import { CloudUploadIcon, HardDriveIcon } from "@lucide/svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { route } from "$lib/ROUTES";
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!">
            {#snippet child({ props })}
                <a href={route("/")} {...props}>
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
