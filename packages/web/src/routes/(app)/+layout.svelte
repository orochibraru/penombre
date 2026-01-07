<script lang="ts">
    import {
        ClockFadingIcon,
        CloudUploadIcon,
        CodeIcon,
        FileIcon,
        FolderIcon,
        FolderPlusIcon,
        FolderSyncIcon,
        ImageIcon,
        MenuIcon,
        MusicIcon,
        PlugIcon,
        SettingsIcon,
        SquarePlusIcon,
        StarIcon,
        TrashIcon,
        UserIcon,
        UsersIcon,
        VideoIcon,
    } from "@lucide/svelte";
    import { page } from "$app/state";
    import SiteHeader from "$lib/components/layout/header.svelte";
    import MusicPlayer from "$lib/components/layout/music-player.svelte";
    import Nav, { type NavMenus } from "$lib/components/layout/nav.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { route } from "$lib/ROUTES";
    import { playableMusic } from "$lib/store/music";
    import { title } from "$lib/store/title";
    import { cn } from "$lib/utils";
    import SidebarBranding from "$lib/components/sidebar-branding.svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import NewFolderDialog from "$lib/components/layout/dialogs/new-folder.svelte";
    import UploadDialog from "$lib/components/layout/dialogs/upload.svelte";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import { MediaQuery } from "svelte/reactivity";

    const { children, data } = $props();

    let newFolderOpen: boolean = $state(false);
    let uploadOpen: boolean = $state(false);
    let mobileCreateDrawerOpen: boolean = $state(false);
    let uploadLoading: boolean = $state(false);

    const nav: NavMenus = {
        general: [
            {
                title: "My Drive",
                url: route("/browse"),
                icon: FolderIcon,
                hideOnMobile: true,
            },
            {
                title: "Recent",
                url: route("/recent"),
                icon: ClockFadingIcon,
                hideOnMobile: true,
            },
            {
                title: "Starred",
                url: route("/starred"),
                icon: StarIcon,
            },
            {
                title: "Shared",
                url: route("/shared"),
                icon: UsersIcon,
            },
            {
                title: "Trash",
                url: route("/trash"),
                icon: TrashIcon,
            },
        ],
        categories: [
            {
                title: "Music",
                url: route("/categories/[category]", {
                    category: "music",
                }),
                icon: MusicIcon,
                accentColor: "pink",
            },
            {
                title: "Documents",
                url: route("/categories/[category]", {
                    category: "documents",
                }),
                icon: FileIcon,
                accentColor: "indigo",
            },
            {
                title: "Images",
                url: route("/categories/[category]", {
                    category: "images",
                }),
                icon: ImageIcon,
                accentColor: "orange",
            },
            {
                title: "Code",
                url: route("/categories/[category]", {
                    category: "code",
                }),
                icon: CodeIcon,
                accentColor: "green",
            },
            {
                title: "Video",
                url: route("/categories/[category]", {
                    category: "video",
                }),
                icon: VideoIcon,
                accentColor: "purple",
            },
        ],
        help: [
            {
                title: "Settings",
                url: route("/settings"),
                icon: SettingsIcon,
                hideOnMobile: true,
            },
            {
                title: "Sync",
                url: route("/sync"),
                icon: FolderSyncIcon,
            },
            {
                title: "API",
                url: "/docs/index.html",
                icon: PlugIcon,
            },
        ],
    };

    const bottomNavItemClass = "flex flex-col gap-1 items-center text-xs";
    const bottomNavItemIconClass = "w-5.5 h-5.5";

    function isActive(itemUrl: string) {
        if (page.url.pathname === "/" && itemUrl === "/") {
            return true;
        }

        if (page.url.pathname.startsWith(itemUrl)) {
            return true;
        }

        return false;
    }

    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

<svelte:head>
    <title>Opendrive - {$title ?? "Home"}</title>
</svelte:head>

<Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
    <Sidebar.Root collapsible="icon" variant="inset">
        <Sidebar.Header>
            <SidebarBranding />
            {#if isDesktop.current}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Button {...props} loading={uploadLoading}>
                                New
                                <SquarePlusIcon />
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-56" align="start">
                        <DropdownMenu.Group>
                            <DropdownMenu.Item
                                class="font-medium"
                                onclick={() => (newFolderOpen = true)}
                            >
                                <FolderPlusIcon />
                                Folder
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                class="font-medium"
                                onclick={() => (uploadOpen = true)}
                            >
                                <CloudUploadIcon />
                                File Upload
                            </DropdownMenu.Item>
                        </DropdownMenu.Group>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            {/if}
        </Sidebar.Header>
        <Sidebar.Content>
            <Nav title="General" items={nav.general} />
            <Nav title="Categories" items={nav.categories} />
            <Nav title="Help" items={nav.help} class="mt-auto" />
        </Sidebar.Content>
    </Sidebar.Root>

    <Sidebar.Inset>
        <SiteHeader user={data.user} />
        <div
            class={cn(
                "flex flex-1 flex-col pb-46 transition-all ",
                $playableMusic !== null ? "lg:pb-26" : "lg:pb-5",
            )}
        >
            <div
                class="main-container @container/main flex flex-1 flex-col gap-5 p-5"
            >
                {@render children()}
            </div>
        </div>
        <MusicPlayer />
        <div
            class="bg-background/20 fixed bottom-0 left-0 w-full rounded-t-4xl border-t px-8 py-2 backdrop-blur-xl md:hidden"
        >
            <div class="flex items-center justify-between gap-5">
                <a
                    href={route("/browse")}
                    class={cn(
                        bottomNavItemClass,
                        isActive(route("/browse")) ? "text-primary" : "",
                    )}
                >
                    <FolderIcon class={bottomNavItemIconClass} />
                    Home
                </a>
                <a
                    href={route("/recent")}
                    class={cn(
                        bottomNavItemClass,
                        isActive(route("/recent")) ? "text-primary" : "",
                    )}
                >
                    <ClockFadingIcon class={bottomNavItemIconClass} />
                    Recent
                </a>

                {#if page.data.hasCustomMenu === true}
                    <button
                        title="Menu"
                        class={cn(
                            bottomNavItemClass,
                            "bg-primary text-white p-3 rounded-full -mt-8 shadow-lg  border-transparent border-2 w-12 h-12 flex items-center justify-center",
                            isActive(route("/create"))
                                ? "text-primary bg-background border-primary"
                                : "",
                        )}
                    >
                        <MenuIcon class="w-6! h-6!" />
                    </button>
                {:else}
                    <button
                        onclick={() => (mobileCreateDrawerOpen = true)}
                        title="New"
                        class={cn(
                            bottomNavItemClass,
                            "bg-primary text-white p-3 rounded-full -mt-8 shadow-lg  border-transparent border-2 w-12 h-12 flex items-center justify-center",
                            isActive(route("/create"))
                                ? "text-primary bg-background border-primary"
                                : "",
                        )}
                    >
                        {#if uploadLoading}
                            <Spinner class="text-white" />
                        {:else}
                            <CloudUploadIcon class="w-6! h-6!" />
                        {/if}
                    </button>
                {/if}

                <a
                    href={route("/account")}
                    class={cn(
                        bottomNavItemClass,
                        isActive(route("/account")) ? "text-primary" : "",
                    )}
                >
                    <UserIcon class={bottomNavItemIconClass} />
                    Account
                </a>

                <a
                    href={route("/settings")}
                    class={cn(
                        bottomNavItemClass,
                        isActive(route("/settings")) ? "text-primary" : "",
                    )}
                >
                    <SettingsIcon class={bottomNavItemIconClass} />
                    Settings
                </a>
            </div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>

<Drawer.Root bind:open={mobileCreateDrawerOpen}>
    <Drawer.Content class="z-50">
        <Drawer.Header>
            <Drawer.Title class="text-lg">New</Drawer.Title>
            <Drawer.Description class="text-sm text-muted-foreground">
                Create a new folder, upload some files.
            </Drawer.Description>
        </Drawer.Header>
        <div class="mx-auto flex w-full flex-col items-start gap-5 p-4">
            <Button
                class="w-full"
                size="lg"
                variant="outline"
                onclick={() => {
                    newFolderOpen = true;
                    mobileCreateDrawerOpen = false;
                }}
            >
                <FolderPlusIcon class="text-primary w-5! h-5!" />
                Folder
            </Button>
            <Button
                class="w-full"
                variant="outline"
                size="lg"
                onclick={() => {
                    uploadOpen = true;
                    mobileCreateDrawerOpen = false;
                }}
            >
                <CloudUploadIcon class="text-primary w-5! h-5!" />
                File upload
            </Button>
        </div>
        <Drawer.Footer>
            <Drawer.Close class={buttonVariants({ variant: "destructive" })}>
                Cancel
            </Drawer.Close>
        </Drawer.Footer>
    </Drawer.Content>
</Drawer.Root>

<NewFolderDialog bind:open={newFolderOpen} />
<UploadDialog bind:open={uploadOpen} bind:loading={uploadLoading} />
