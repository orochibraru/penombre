<script lang="ts">
    import {
        ClockFadingIcon,
        CloudUploadIcon,
        CodeIcon,
        FileArchiveIcon,
        FileIcon,
        FolderIcon,
        FolderPlusIcon,
        FolderSyncIcon,
        ImageIcon,
        MenuIcon,
        MusicIcon,
        PlugIcon,
        Rotate3dIcon,
        SettingsIcon,
        SquarePlusIcon,
        StarIcon,
        TrashIcon,
        UserIcon,
        UsersIcon,
        VideoIcon,
    } from "@lucide/svelte";
    import { navigating, page } from "$app/state";
    import SiteHeader from "$lib/components/layout/header.svelte";
    import MusicPlayer from "$lib/components/layout/music-player.svelte";
    import Nav, { type NavMenus } from "$lib/components/layout/nav.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { playableMusic } from "$lib/store/music";
    import { title } from "$lib/store/title";
    import {
        uploadDialogOpen,
        newFolderDialogOpen,
        closeAllDialogs,
        globalUploadProgress,
    } from "$lib/store/upload";
    import { cn } from "$lib/utils";
    import SidebarBranding from "$lib/components/sidebar-branding.svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import NewFolderDialog from "$lib/components/layout/dialogs/new-folder-dialog.svelte";
    import UploadDialog from "$lib/components/layout/dialogs/upload-dialog.svelte";
    import UploadProgressIndicator from "$lib/components/layout/upload-progress-indicator.svelte";
    import Spinner from "$lib/components/ui/Spinner.svelte";
    import VersionCheck from "$lib/components/layout/version-check.svelte";
    import { FileCategoryEnum } from "$lib/file-helpers";
    import { m } from "$lib/paraglide/messages.js";
    import { customMenu } from "$lib/store/custom-menu";

    const { children, data } = $props();

    // Close all dialogs when navigation starts
    $effect(() => {
        if (navigating) {
            closeAllDialogs();
        }
    });

    let mobileCreateDrawerOpen: boolean = $state(false);
    let mobileMenuDrawerOpen: boolean = $state(false);
    let uploadLoading: boolean = $state(false);

    const nav: NavMenus = $derived({
        general: [
            {
                title: m.nav_my_drive(),
                url: "/browse",
                icon: FolderIcon,
                hideOnMobile: true,
            },
            {
                title: m.nav_recent(),
                url: "/recent",
                icon: ClockFadingIcon,
                hideOnMobile: true,
            },
            {
                title: m.nav_starred(),
                url: "/starred",
                icon: StarIcon,
                count: data.counts?.starred,
            },
            {
                title: m.nav_shared(),
                url: "/shared",
                icon: UsersIcon,
            },
            {
                title: m.nav_trash(),
                url: "/trash",
                icon: TrashIcon,
                count: data.counts?.trash,
            },
        ],
        categories: [
            {
                title: m.nav_music(),
                url: `/categories/${FileCategoryEnum.MUSIC}`,
                icon: MusicIcon,
                accentColor: "pink",
            },
            {
                title: m.nav_documents(),
                url: `/categories/${FileCategoryEnum.DOCUMENTS}`,
                icon: FileIcon,
                accentColor: "indigo",
            },
            {
                title: m.nav_images(),
                url: `/categories/${FileCategoryEnum.IMAGES}`,
                icon: ImageIcon,
                accentColor: "orange",
            },
            {
                title: m.nav_code(),
                url: `/categories/${FileCategoryEnum.CODE}`,
                icon: CodeIcon,
                accentColor: "green",
            },
            {
                title: m.nav_video(),
                url: `/categories/${FileCategoryEnum.VIDEO}`,
                icon: VideoIcon,
                accentColor: "purple",
            },
            {
                title: m.nav_archives(),
                url: `/categories/${FileCategoryEnum.ARCHIVES}`,
                icon: FileArchiveIcon,
                accentColor: "teal",
            },
            {
                title: m.nav_3d_objects(),
                url: `/categories/${FileCategoryEnum.THREE_D}`,
                icon: Rotate3dIcon,
                accentColor: "rose",
            },
        ],
        help: [
            {
                title: m.nav_settings(),
                url: "/settings",
                icon: SettingsIcon,
                hideOnMobile: true,
            },
            {
                title: m.nav_sync(),
                url: "/sync",
                icon: FolderSyncIcon,
            },
            {
                title: m.nav_api(),
                url: "/api/v1/docs",
                icon: PlugIcon,
            },
        ],
    });

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

    // Pages where the upload/new button should be hidden
    const noUploadPages = ["/settings", "/account", "/admin", "/sync"];
    let showUploadButton = $derived(
        !noUploadPages.some((p) => page.url.pathname.startsWith(p)),
    );
</script>

<svelte:head>
    <title>{data.config.appName} - {$title ?? m.home()}</title>
</svelte:head>

<Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
    <Sidebar.Root collapsible="icon" variant="inset">
        <Sidebar.Header>
            <SidebarBranding />
            {#if showUploadButton}
                <div class="hidden md:block">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                                <Button
                                    {...props}
                                    loading={uploadLoading}
                                    class="relative overflow-hidden w-full"
                                >
                                    {#if $globalUploadProgress.isUploading}
                                        <div
                                            class="absolute inset-0 bg-primary/20 transition-all"
                                            style="width: {$globalUploadProgress.progress}%"
                                        ></div>
                                        <span class="relative z-10">
                                            {m.uploading_progress({
                                                progress: String(
                                                    $globalUploadProgress.progress,
                                                ),
                                                count: String(
                                                    $globalUploadProgress.count,
                                                ),
                                            })}
                                        </span>
                                    {:else}
                                        {m.new()}
                                        <SquarePlusIcon />
                                    {/if}
                                </Button>
                            {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content class="w-56" align="start">
                            <DropdownMenu.Group>
                                <DropdownMenu.Item
                                    class="font-medium"
                                    onclick={() =>
                                        ($newFolderDialogOpen = true)}
                                >
                                    <FolderPlusIcon />
                                    {m.folder()}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    class="font-medium"
                                    onclick={() => ($uploadDialogOpen = true)}
                                >
                                    <CloudUploadIcon />
                                    {m.file_upload()}
                                </DropdownMenu.Item>
                            </DropdownMenu.Group>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </div>
            {/if}
        </Sidebar.Header>
        <Sidebar.Content>
            <Nav title={m.nav_general()} items={nav.general} />
            <Nav title={m.nav_categories()} items={nav.categories} />
            <Nav title={m.nav_help()} items={nav.help} class="mt-auto" />
            <VersionCheck config={data.config} version={data.versionCheck} />
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
                    href="/browse"
                    class={cn(
                        bottomNavItemClass,
                        isActive("/browse") ? "text-primary" : "",
                    )}
                >
                    <FolderIcon class={bottomNavItemIconClass} />
                    {m.home()}
                </a>
                <a
                    href="/recent"
                    class={cn(
                        bottomNavItemClass,
                        isActive("/recent") ? "text-primary" : "",
                    )}
                >
                    <ClockFadingIcon class={bottomNavItemIconClass} />
                    {m.nav_recent()}
                </a>

                {#if page.data.hasCustomMenu === true || !showUploadButton}
                    <button
                        onclick={() => (mobileMenuDrawerOpen = true)}
                        title={m.menu()}
                        class={cn(
                            bottomNavItemClass,
                            "bg-primary text-white p-3 rounded-full -mt-8 shadow-lg  border-transparent border-2 w-12 h-12 flex items-center justify-center",
                        )}
                    >
                        <MenuIcon class="w-6! h-6!" />
                    </button>
                {:else}
                    <button
                        onclick={() => (mobileCreateDrawerOpen = true)}
                        title={m.new()}
                        class={cn(
                            bottomNavItemClass,
                            "bg-primary text-white p-3 rounded-full -mt-8 shadow-lg border-transparent border-2 w-12 h-12 flex items-center justify-center relative overflow-hidden",
                        )}
                    >
                        {#if $globalUploadProgress.isUploading}
                            <div
                                class="absolute inset-0 bg-white/20 transition-all"
                                style="height: {$globalUploadProgress.progress}%; bottom: 0; top: auto;"
                            ></div>
                            <span class="relative z-10 text-xs font-bold">
                                {$globalUploadProgress.progress}%
                            </span>
                        {:else if uploadLoading}
                            <Spinner class="text-white" />
                        {:else}
                            <CloudUploadIcon class="w-6! h-6!" />
                        {/if}
                    </button>
                {/if}

                <a
                    href="/account"
                    class={cn(
                        bottomNavItemClass,
                        isActive("/account") ? "text-primary" : "",
                    )}
                >
                    <UserIcon class={bottomNavItemIconClass} />
                    {m.account()}
                </a>

                <a
                    href="/settings"
                    class={cn(
                        bottomNavItemClass,
                        isActive("/settings") ? "text-primary" : "",
                    )}
                >
                    <SettingsIcon class={bottomNavItemIconClass} />
                    {m.nav_settings()}
                </a>
            </div>
        </div>
    </Sidebar.Inset>
</Sidebar.Provider>

<Drawer.Root bind:open={mobileCreateDrawerOpen}>
    <Drawer.Content class="z-50">
        <Drawer.Header>
            <Drawer.Title class="text-lg">{m.new()}</Drawer.Title>
            <Drawer.Description class="text-sm text-muted-foreground">
                {m.create_drawer_description()}
            </Drawer.Description>
        </Drawer.Header>
        <div class="mx-auto flex w-full flex-col items-start gap-5 p-4">
            <Button
                class="w-full"
                size="lg"
                variant="outline"
                onclick={() => {
                    $newFolderDialogOpen = true;
                    mobileCreateDrawerOpen = false;
                }}
            >
                <FolderPlusIcon class="text-primary w-5! h-5!" />
                {m.folder()}
            </Button>
            <Button
                class="w-full"
                variant="outline"
                size="lg"
                onclick={() => {
                    $uploadDialogOpen = true;
                    mobileCreateDrawerOpen = false;
                }}
            >
                <CloudUploadIcon class="text-primary w-5! h-5!" />
                {m.file_upload()}
            </Button>
        </div>
        <Drawer.Footer>
            <Drawer.Close class={buttonVariants({ variant: "destructive" })}>
                {m.cancel()}
            </Drawer.Close>
        </Drawer.Footer>
    </Drawer.Content>
</Drawer.Root>

<NewFolderDialog bind:open={$newFolderDialogOpen} />
<UploadDialog bind:open={$uploadDialogOpen} bind:loading={uploadLoading} />
<UploadProgressIndicator />

<Drawer.Root bind:open={mobileMenuDrawerOpen}>
    <Drawer.Content class="z-50">
        <Drawer.Header>
            <Drawer.Title class="text-lg"
                >{$customMenu?.title ?? m.menu()}</Drawer.Title
            >
        </Drawer.Header>
        <div class="mx-auto flex w-full flex-col items-start gap-3 p-4">
            {#if $customMenu}
                {#each $customMenu.items as item (item.url)}
                    {@const Icon = item.icon}
                    <a
                        href={item.url}
                        class={cn(
                            buttonVariants({
                                variant: isActive(item.url)
                                    ? "default"
                                    : "outline",
                                size: "lg",
                            }),
                            "w-full justify-start",
                        )}
                        onclick={() => (mobileMenuDrawerOpen = false)}
                    >
                        <Icon class="w-5! h-5!" />
                        {item.title}
                    </a>
                {/each}
            {/if}
        </div>
        <Drawer.Footer>
            <Drawer.Close class={buttonVariants({ variant: "destructive" })}>
                {m.cancel()}
            </Drawer.Close>
        </Drawer.Footer>
    </Drawer.Content>
</Drawer.Root>
