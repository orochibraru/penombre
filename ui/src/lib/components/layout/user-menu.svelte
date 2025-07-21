<script lang="ts">
  import {
    EllipsisVerticalIcon,
    LogOutIcon,
    UserCircleIcon,
  } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { route } from "$lib/ROUTES";
  import { api, type User } from "$lib/api";
  import { toast } from "svelte-sonner";

  type Props = {
    user: User;
  };

  let { user }: Props = $props();

  const sidebar = Sidebar.useSidebar();

  async function signOutCallback() {
    return new Promise(async (resolve, reject) => {
      try {
        const { error } = await api.POST("/api/v1/auth/sign-out");
        if (error) {
          return reject(error.error);
        }

        return resolve(true);
      } catch (e) {
        return reject(e);
      }
    })
      .then(() => goto(route("/auth/sign-in"), { invalidateAll: true }))
      .catch((e) => {
        throw e;
      });
  }

  async function handleSignOut() {
    toast.promise(signOutCallback, {
      loading: "Signing you out",
      success: "You were signed out",
      error: "Failed to sign you out",
    });
  }
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            {...props}
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border"
          >
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image src={user.image} alt={user.name} />
              <Avatar.Fallback class="rounded-lg">NB</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
            <EllipsisVerticalIcon class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image src={user.image} alt={user.name} />
              <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item>
            {#snippet child({ props })}
              <a href={route("/account")} {...props}>
                <UserCircleIcon />
                <span>Account</span>
              </a>
            {/snippet}
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Item onclick={() => handleSignOut()}>
          <LogOutIcon />
          Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
