<script lang="ts">
  import {
    ClockFadingIcon,
    CodeIcon,
    FileIcon,
    FolderIcon,
    FolderSyncIcon,
    HardDriveIcon,
    ImageIcon,
    MusicIcon,
    PlugIcon,
    SettingsIcon,
    StarIcon,
    TrashIcon,
    UsersIcon,
  } from "@lucide/svelte";

  import SiteHeader from "$lib/components/layout/header.svelte";
  import Nav, { type NavItem } from "$lib/components/layout/nav.svelte";
  import NavUser from "$lib/components/layout/user-menu.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { route } from "$lib/ROUTES";
  import { title } from "$lib/store/title";
  import MusicPlayer from "$lib/components/layout/music-player.svelte";

  const { children, data } = $props();

  let newFolderOpen: boolean = $state(false);
  let uploadOpen: boolean = $state(false);

  type NavMenus = {
    [key: string]: NavItem[];
  };

  const nav: NavMenus = {
    general: [
      {
        title: "My Drive",
        url: route("/browse"),
        icon: FolderIcon,
      },
      {
        title: "Recent",
        url: route("/recent"),
        icon: ClockFadingIcon,
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
    ],
    help: [
      {
        title: "Settings",
        url: route("/settings"),
        icon: SettingsIcon,
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
</script>

<svelte:head>
  <title>Opendrive - {$title}</title>
</svelte:head>

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
  <Sidebar.Root collapsible="icon" variant="inset">
    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
            {#snippet child({ props })}
              <a href={route("/")} {...props}>
                <HardDriveIcon class="!size-5" />
                <span class="text-base font-semibold">Opendrive.</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>
    <Sidebar.Content>
      <Nav title="General" items={nav.general} />
      <Nav title="Categories" items={nav.categories} />
      <Nav title="Help" items={nav.help} class="mt-auto" />
    </Sidebar.Content>
    <Sidebar.Footer>
      {#if data.user}
        <NavUser user={data.user} />
      {/if}
    </Sidebar.Footer>
  </Sidebar.Root>

  <Sidebar.Inset>
    <SiteHeader bind:newFolderOpen bind:uploadOpen />
    <div class="flex flex-1 flex-col pb-26">
      <div
        class="main-container @container/main flex flex-1 flex-col gap-5 p-5"
      >
        {@render children()}
      </div>
    </div>
    <MusicPlayer />
  </Sidebar.Inset>
</Sidebar.Provider>
