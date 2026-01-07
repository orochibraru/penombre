<script lang="ts">
    import {
        ArrowLeftIcon,
        CogIcon,
        ComputerIcon,
        HardDriveIcon,
    } from "@lucide/svelte";
    import Nav, { type NavItem } from "$lib/components/layout/nav.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { route } from "$lib/ROUTES";
    import { cn } from "$lib/utils";
    import Button from "$lib/components/ui/button/button.svelte";
    import SidebarBranding from "$lib/components/sidebar-branding.svelte";

    const accountNav: NavItem[] = [
        {
            title: "General",
            url: route("/settings"),
            icon: CogIcon,
            isRoot: true,
        },
        {
            title: "Display",
            url: route("/settings/display"),
            icon: ComputerIcon,
        },
        {
            title: "Storage",
            url: route("/settings/storage"),
            icon: HardDriveIcon,
        },
    ];

    const { children } = $props();
</script>

<Sidebar.Root variant="inset">
    <Sidebar.Header>
        <SidebarBranding />
        <Button class="w-full" variant="outline" href={route("/browse")}>
            <ArrowLeftIcon />
            Back to My Drive
            <HardDriveIcon />
        </Button>
    </Sidebar.Header>
    <Sidebar.Content>
        <Nav title="Account" items={accountNav} />
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
