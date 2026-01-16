<script lang="ts">
    import { CircleUserIcon, CogIcon, LogOutIcon } from "@lucide/svelte";
    import { type User } from "$lib/api-client";
    import { handleSignOut } from "$lib/auth-helpers";
    import * as Avatar from "$lib/components/ui/avatar/index";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { route } from "$lib/ROUTES";
    import Button from "$lib/components/ui/button/button.svelte";
    import { page } from "$app/state";

    type Props = {
        user: User;
    };

    let { user }: Props = $props();
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <Button
                        {...props}
                        size="lg"
                        variant="ghost"
                        class="p-0 hover:bg-transparent"
                    >
                        <Avatar.Root class="size-8 rounded-full">
                            <Avatar.Image
                                src={user.image}
                                alt={user.name}
                                loading="lazy"
                            />
                            <Avatar.Fallback class="rounded-lg">
                                NB
                            </Avatar.Fallback>
                        </Avatar.Root>
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
            >
                <DropdownMenu.Label class="p-0 font-normal">
                    <div
                        class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                    >
                        <div
                            class="grid flex-1 text-left text-sm leading-tight"
                        >
                            <span class="truncate font-medium">
                                {user.name}
                            </span>
                            <span
                                class="text-muted-foreground truncate text-xs"
                            >
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
                                <CircleUserIcon />
                                <span>Account</span>
                            </a>
                        {/snippet}
                    </DropdownMenu.Item>
                    {#if page.data.isAdmin}
                        <DropdownMenu.Item>
                            {#snippet child({ props })}
                                <a href={route("/admin")} {...props}>
                                    <CogIcon />
                                    <span>Admin</span>
                                </a>
                            {/snippet}
                        </DropdownMenu.Item>
                    {/if}
                </DropdownMenu.Group>
                <DropdownMenu.Item onclick={() => handleSignOut()}>
                    <LogOutIcon />
                    Sign out
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
