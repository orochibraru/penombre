<script lang="ts">
	import {
		ClockFadingIcon,
		CloudUploadIcon,
		CodeIcon,
		FileArchiveIcon,
		FileIcon,
		FileTextIcon,
		FolderIcon,
		FolderPlusIcon,
		HardDriveDownloadIcon,
		HardDriveIcon,
		ImageIcon,
		MenuIcon,
		MusicIcon,
		PlugIcon,
		PresentationIcon,
		Rotate3dIcon,
		SettingsIcon,
		ShieldIcon,
		SquarePlusIcon,
		StarIcon,
		TableIcon,
		TrashIcon,
		UserIcon,
		UsersIcon,
		VideoIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { navigating, page } from "$app/state";
	import NewFolderDialog from "$lib/components/layout/dialogs/new-folder-dialog.svelte";
	import UploadDialog from "$lib/components/layout/dialogs/upload-dialog.svelte";
	import SiteHeader from "$lib/components/layout/header.svelte";
	import MusicPlayer from "$lib/components/layout/music-player.svelte";
	import Nav, {
		type NavItem,
		type NavMenus,
	} from "$lib/components/layout/nav.svelte";
	import Onboarding from "$lib/components/layout/onboarding.svelte";
	import UploadProgressIndicator from "$lib/components/layout/upload-progress-indicator.svelte";
	import VersionCheck from "$lib/components/layout/version-check.svelte";
	import SidebarBranding from "$lib/components/sidebar-branding.svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index";
	import Spinner from "$lib/components/ui/spinner.svelte";
	import {
		createDocument,
		DOCUMENT_KINDS,
		type DocumentKind,
	} from "$lib/documents";
	import { FileCategoryEnum } from "$lib/file-helpers";
	import { m } from "$lib/paraglide/messages.js";
	import { customMenu } from "$lib/store/custom-menu";
	import { playableMusic } from "$lib/store/music";
	import { title } from "$lib/store/title";
	import {
		closeAllDialogs,
		globalUploadProgress,
		newFolderDialogOpen,
		uploadDialogOpen,
	} from "$lib/store/upload";
	import { applyTheme } from "$lib/theme";
	import { resumeUploads } from "$lib/upload/manager";
	import { cn } from "$lib/utils";

	const { children, data } = $props();

	// Simple mode: bare shared file browser, drop drive-only concepts
	// (recent/starred/shared/categories) but keep trash for undo safety.
	const simpleMode = $derived(data.config?.simpleMode ?? false);

	// Auth bypass: nobody signs in, so there's no profile/admin to show.
	const authBypassed = $derived(data.authBypassed ?? false);

	// Shown once per account, on the first load after signing in. Skipping
	// still records it as done, so it never reappears uninvited.
	let onboardingOpen = $state(false);

	$effect(() => {
		if (data.preferences && data.preferences.onboarded === false) {
			onboardingOpen = true;
		}
	});

	// Appearance preferences are per-user, so they can only be applied once the
	// session's preferences have loaded.
	$effect(() => {
		applyTheme(data.preferences);
	});

	// Close all dialogs when navigation starts
	$effect(() => {
		if (navigating) {
			closeAllDialogs();
		}
	});

	// A reload does not lose a transfer: the queue is in IndexedDB, so
	// whatever was in flight is picked up again and the progress panel comes
	// back with it.
	onMount(() => {
		void resumeUploads();
	});

	/**
	 * The document types the New menu can create. Each lands in the folder
	 * currently on screen and opens straight in its editor — a new document
	 * that leaves you back in the file list is a document nobody writes in.
	 */
	const newDocumentKinds = $derived([
		{
			kind: "document" as const,
			label: m.new_document(),
			icon: FileTextIcon,
			color: DOCUMENT_KINDS.document.color,
			title: m.new_document_title(),
		},
		{
			kind: "sheet" as const,
			label: m.new_sheet(),
			icon: TableIcon,
			color: DOCUMENT_KINDS.sheet.color,
			title: m.new_sheet_title(),
		},
		{
			kind: "presentation" as const,
			label: m.new_presentation(),
			icon: PresentationIcon,
			color: DOCUMENT_KINDS.presentation.color,
			title: m.new_presentation_title(),
		},
	]);

	let creatingDocument = $state(false);
	let newMenuOpen = $state(false);

	async function newDocument(kind: DocumentKind) {
		const entry = newDocumentKinds.find((item) => item.kind === kind);
		// Closed explicitly: the item navigates rather than opening a dialog,
		// and the menu would otherwise stay up over the editor it just opened.
		newMenuOpen = false;
		creatingDocument = true;
		// `page.params.path` is the folder being browsed; at the drive root it
		// is undefined and the file lands there.
		const folder = page.params.path?.split("/").pop();
		const id = await createDocument(kind, entry?.title ?? "Untitled", folder);
		creatingDocument = false;

		if (!id) {
			toast.error(m.new_document_error());
			return;
		}
		await goto(resolve("/(app)/edit/[fileId]", { fileId: id }));
	}
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
			...(simpleMode
				? []
				: ([
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
					] satisfies NavItem[])),
			{
				title: m.nav_trash(),
				url: "/trash",
				icon: TrashIcon,
				count: data.counts?.trash,
			},
		],
		categories: simpleMode
			? []
			: ([
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
				] satisfies NavItem[]),
		volumes: (data.volumes ?? []).map((volume) => ({
			title: volume.label,
			url: `/volumes/${volume.name}`,
			icon: volume.readOnly ? HardDriveDownloadIcon : HardDriveIcon,
		})) satisfies NavItem[],
		help: [
			{
				title: m.nav_settings(),
				url: "/settings",
				icon: SettingsIcon,
				hideOnMobile: true,
			},
			// The profile dropdown is desktop-only, so this used to be the one
			// route with no way to reach it from a phone.
			...(page.data.isAdmin
				? ([
						{
							title: m.admin(),
							url: "/admin",
							icon: ShieldIcon,
							accentColor: "amber",
						},
					] satisfies NavItem[])
				: []),
			{
				title: m.nav_api(),
				url: "/api-docs",
				icon: PlugIcon,
			},
		],
	});

	/**
	 * The sidebar's groups, flattened for the mobile drawer. `hideOnMobile`
	 * is a desktop-sidebar hint (those rows are duplicated in the bottom bar);
	 * the drawer is the whole navigation, so it shows everything.
	 */
	const mobileNavGroups = $derived(
		[
			{ title: m.nav_general(), items: nav.general ?? [] },
			{ title: m.nav_volumes(), items: nav.volumes ?? [] },
			{ title: m.nav_categories(), items: nav.categories ?? [] },
			{ title: m.nav_help(), items: nav.help ?? [] },
		].filter((group) => group.items.length > 0),
	);

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
	const noUploadPages = ["/settings", "/account", "/admin", "/api-docs"];
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
                    <DropdownMenu.Root bind:open={newMenuOpen}>
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
                            <DropdownMenu.Separator />
                            <DropdownMenu.Group>
                                {#each newDocumentKinds as entry (entry.kind)}
                                    {@const Icon = entry.icon}
                                    <DropdownMenu.Item
                                        class="font-medium"
                                        disabled={creatingDocument}
                                        onclick={() => newDocument(entry.kind)}
                                    >
                                        <Icon class={entry.color} />
                                        {entry.label}
                                    </DropdownMenu.Item>
                                {/each}
                            </DropdownMenu.Group>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </div>
            {/if}
        </Sidebar.Header>
        <Sidebar.Content>
            <Nav title={m.nav_general()} items={nav.general} />
            {#if (nav.volumes ?? []).length > 0}
                <Nav title={m.nav_volumes()} items={nav.volumes ?? []} />
            {/if}
            {#if !simpleMode}
                <Nav title={m.nav_categories()} items={nav.categories} />
            {/if}
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
                    href={resolve("/browse")}
                    class={cn(
                        bottomNavItemClass,
                        isActive("/browse") ? "text-primary" : "",
                    )}
                >
                    <FolderIcon class={bottomNavItemIconClass} />
                    {m.home()}
                </a>
                {#if !simpleMode}
                    <a
                        href={resolve("/recent")}
                        class={cn(
                            bottomNavItemClass,
                            isActive("/recent") ? "text-primary" : "",
                        )}
                    >
                        <ClockFadingIcon class={bottomNavItemIconClass} />
                        {m.nav_recent()}
                    </a>
                {/if}

                <!-- One drawer for everything: the sidebar has no mobile
                     counterpart any more, so this is the only way to reach the
                     nav, and splitting it from "New" left half the app
                     unreachable from a phone. -->
                <button
                    onclick={() => (mobileMenuDrawerOpen = true)}
                    title={m.menu()}
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
                        <MenuIcon class="w-6! h-6!" />
                    {/if}
                </button>

                {#if !authBypassed}
                    <a
                        href={resolve("/account")}
                        class={cn(
                            bottomNavItemClass,
                            isActive("/account") ? "text-primary" : "",
                        )}
                    >
                        <UserIcon class={bottomNavItemIconClass} />
                        {m.account()}
                    </a>
                {/if}

                <a
                    href={resolve("/settings")}
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

<Onboarding bind:open={onboardingOpen} preferences={data.preferences} />

<NewFolderDialog bind:open={$newFolderDialogOpen} />
<UploadDialog bind:open={$uploadDialogOpen} bind:loading={uploadLoading} />
<UploadProgressIndicator />

<!--
  The one mobile drawer. The sidebar's Sheet is desktop-only now, so this is
  where the whole navigation lives — grouped exactly as the sidebar groups it —
  with the create/upload actions on top and any page-provided menu above those.
-->
<Drawer.Root bind:open={mobileMenuDrawerOpen}>
    <Drawer.Content class="z-50 max-h-[85svh]">
        <Drawer.Header>
            <Drawer.Title class="text-lg">
                {$customMenu?.title ?? m.menu()}
            </Drawer.Title>
        </Drawer.Header>
        <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {#if $customMenu}
                <div class="flex flex-col gap-2">
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
                </div>
            {/if}

            {#if showUploadButton}
                <div class="flex flex-col gap-2">
                    <p
                        class="text-muted-foreground px-1 text-xs font-medium uppercase"
                    >
                        {m.new()}
                    </p>
                    <Button
                        class="w-full justify-start"
                        size="lg"
                        variant="outline"
                        onclick={() => {
                            $newFolderDialogOpen = true;
                            mobileMenuDrawerOpen = false;
                        }}
                    >
                        <FolderPlusIcon class="text-primary w-5! h-5!" />
                        {m.folder()}
                    </Button>
                    <Button
                        class="w-full justify-start"
                        variant="outline"
                        size="lg"
                        onclick={() => {
                            $uploadDialogOpen = true;
                            mobileMenuDrawerOpen = false;
                        }}
                    >
                        <CloudUploadIcon class="text-primary w-5! h-5!" />
                        {m.file_upload()}
                    </Button>
                    {#each newDocumentKinds as entry (entry.kind)}
                        {@const Icon = entry.icon}
                        <Button
                            class="w-full justify-start"
                            variant="outline"
                            size="lg"
                            disabled={creatingDocument}
                            onclick={() => {
                                mobileMenuDrawerOpen = false;
                                newDocument(entry.kind);
                            }}
                        >
                            <Icon class={cn(entry.color, "w-5! h-5!")} />
                            {entry.label}
                        </Button>
                    {/each}
                </div>
            {/if}

            {#each mobileNavGroups as group (group.title)}
                <div class="flex flex-col gap-2">
                    <p
                        class="text-muted-foreground px-1 text-xs font-medium uppercase"
                    >
                        {group.title}
                    </p>
                    {#each group.items as item (item.url)}
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
                </div>
            {/each}
        </div>
        <Drawer.Footer>
            <Drawer.Close class={buttonVariants({ variant: "outline" })}>
                {m.close()}
            </Drawer.Close>
        </Drawer.Footer>
    </Drawer.Content>
</Drawer.Root>
