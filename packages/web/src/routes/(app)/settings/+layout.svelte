<script lang="ts">
    import {
        ArrowLeftIcon,
        CogIcon,
        ComputerIcon,
        HardDriveIcon,
    } from "@lucide/svelte";
    import Nav, { type NavItem } from "$lib/components/layout/nav.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { cn } from "$lib/utils";
    import Button from "$lib/components/ui/button/button.svelte";
    import SidebarBranding from "$lib/components/sidebar-branding.svelte";
    import * as m from "$lib/paraglide/messages.js";
    import { customMenu } from "$lib/store/custom-menu";

    const accountNav: NavItem[] = [
        {
            title: m.settings_nav_general(),
            url: "/settings",
            icon: CogIcon,
            isRoot: true,
        },
        {
            title: m.settings_nav_display(),
            url: "/settings/display",
            icon: ComputerIcon,
        },
        {
            title: m.settings_nav_storage(),
            url: "/settings/storage",
            icon: HardDriveIcon,
        },
    ];

    const { children } = $props();

    $effect(() => {
        customMenu.set({ title: m.nav_settings(), items: accountNav });
        return () => customMenu.set(null);
    });
</script>

<Sidebar.Root variant="inset">
    <Sidebar.Header>
        <SidebarBranding />
        <Button class="w-full" variant="outline" href="/browse">
            <ArrowLeftIcon />
            {m.back_to_my_drive()}
            <HardDriveIcon />
        </Button>
    </Sidebar.Header>
    <Sidebar.Content>
        <Nav title={m.nav_settings()} items={accountNav} />
    </Sidebar.Content>
</Sidebar.Root>
<Sidebar.Inset>
    <div class={cn("flex flex-1 flex-col pb-46 transition-all")}>
        <div
            class="main-container @container/main flex flex-1 flex-col gap-5 p-5"
        >
            {@render children()}
        </div>
    </div>
</Sidebar.Inset>
