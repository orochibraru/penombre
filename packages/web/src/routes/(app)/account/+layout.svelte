<script lang="ts">
    import {
        ArrowLeftIcon,
        HardDriveIcon,
        LockIcon,
        SmartphoneIcon,
        UserIcon,
    } from "@lucide/svelte";
    import Nav, { type NavItem } from "$lib/components/layout/nav.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { cn } from "$lib/utils";
    import Button from "$lib/components/ui/button/button.svelte";
    import SidebarBranding from "$lib/components/sidebar-branding.svelte";
    import * as m from "$lib/paraglide/messages.js";

    const accountNav: NavItem[] = [
        {
            title: m.account_nav_personal(),
            url: "/account",
            icon: UserIcon,
            isRoot: true,
        },
        {
            title: m.account_nav_activity(),
            url: "/account/activity",
            icon: HardDriveIcon,
        },
        {
            title: m.account_nav_security(),
            url: "/account/security",
            icon: LockIcon,
        },
        {
            title: m.account_nav_sessions(),
            url: "/account/sessions",
            icon: SmartphoneIcon,
        },
    ];

    const { children } = $props();
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
        <Nav title={m.account()} items={accountNav} />
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
