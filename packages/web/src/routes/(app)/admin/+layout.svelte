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
            title: m.admin_nav_dashboard(),
            url: "/admin",
            icon: CogIcon,
            isRoot: true,
        },
        {
            title: m.admin_nav_users(),
            url: "/admin/users",
            icon: ComputerIcon,
        },
        {
            title: m.admin_nav_storage(),
            url: "/admin/storage",
            icon: HardDriveIcon,
        },
    ];

    const { children } = $props();

    $effect(() => {
        customMenu.set({ title: m.admin(), items: accountNav });
        return () => customMenu.set(null);
    });
</script>

<Sidebar.Root variant="inset">
    <Sidebar.Header>
        <SidebarBranding />
        <Button class="w-full" variant="outline" href={"/browse"}>
            <ArrowLeftIcon />
            {m.back_to_my_drive()}
            <HardDriveIcon />
        </Button>
    </Sidebar.Header>
    <Sidebar.Content>
        <Nav title={m.admin()} items={accountNav} />
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
