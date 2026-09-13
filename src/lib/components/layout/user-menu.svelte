<script lang="ts">
	import { CircleUserIcon, LogOutIcon } from "@lucide/svelte";
	import { resolve } from "$app/paths";
	import { type User } from "$lib/api";
	import { handleSignOut } from "$lib/auth-helpers";
	import * as Avatar from "$lib/components/ui/avatar/index";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
	import * as Sidebar from "$lib/components/ui/sidebar/index";
	import * as m from "$lib/paraglide/messages.js";

	interface Props {
		user: User;
	}

	let { user }: Props = $props();

	/**
	 * Up to two letters from the display name, falling back to the email —
	 * the avatar used to render a hard-coded "NB" for every account.
	 */
	const initials = $derived(
		(user.name?.trim() || user.email || "?")
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("") || "?",
	);
</script>

<Sidebar.Menu>
    <Sidebar.MenuItem>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <!-- Same outline icon button as the bell beside it, and
                         `rounded-[inherit]` keeps the avatar on the account's
                         corner preference rather than a fixed circle. -->
                    <Button
                        {...props}
                        size="icon"
                        variant="outline"
                        class="overflow-hidden p-0"
                    >
                        <Avatar.Root class="size-full rounded-[inherit]">
                            <Avatar.Image
                                src={user.image}
                                alt={user.name}
                                loading="lazy"
                            />
                            <Avatar.Fallback
                                class="rounded-[inherit] bg-transparent text-xs"
                            >
                                {initials}
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
                            <a href={resolve("/account")} {...props}>
                                <CircleUserIcon />
                                <span>{m.account()}</span>
                            </a>
                        {/snippet}
                    </DropdownMenu.Item>
                </DropdownMenu.Group>
                <DropdownMenu.Item onclick={() => handleSignOut()}>
                    <LogOutIcon />
                    {m.sign_out()}
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </Sidebar.MenuItem>
</Sidebar.Menu>
