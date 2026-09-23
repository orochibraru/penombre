<script lang="ts">
	import { EllipsisIcon } from "@lucide/svelte";
	import type { User } from "better-auth";
	import { MediaQuery } from "svelte/reactivity";
	import Notifications from "#lib/components/layout/notifications.svelte";
	import UserMenu from "#lib/components/layout/user-menu.svelte";
	import * as Breadcrumb from "#lib/components/ui/breadcrumb/index.js";
	import * as DropdownMenu from "#lib/components/ui/dropdown-menu/index.js";
	import { Separator } from "#lib/components/ui/separator/index.js";
	import * as Sidebar from "#lib/components/ui/sidebar/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import type { BreadCrumb } from "#lib/utils.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	interface Props {
		user: User;
	}

	let { user }: Props = $props();

	const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

<header
    class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
    <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <!-- Desktop only: on a phone the whole navigation lives in the
             bottom-bar drawer, and the sidebar's Sheet is not rendered. Which
             also leaves nothing branding the app there, hence the logo. -->
        <Sidebar.Trigger class="-ml-1 hidden md:flex" />
        <a href={resolve("/(app)")} class="-ml-1 me-1 flex items-center md:hidden">
            <img
                src="/logo.svg"
                alt={`${page.data.config.appName} logo`}
                class="text-primary size-6"
            />
        </a>
        <Separator
            orientation="vertical"
            class="mx-2 hidden data-[orientation=vertical]:h-4 md:block"
        />

        <Breadcrumb.Root>
            <Breadcrumb.List>
                {#if page.data.crumbs}
                    {@const crumbs: BreadCrumb[] = page.data.crumbs}
                    {#if isDesktop.current}
                        {#each crumbs as crumb, index}
                            {#if index > 0}
                                <Breadcrumb.Separator />
                            {/if}
                            {#if index === crumbs.length - 1}
                                <Breadcrumb.Item class="min-w-0 md:text-sm">
                                    <Breadcrumb.Page class="truncate">
                                        {crumb.title}
                                    </Breadcrumb.Page>
                                </Breadcrumb.Item>
                            {:else}
                                <Breadcrumb.Item class="min-w-0 md:text-sm">
                                    <Breadcrumb.Link href={crumb.href} class="truncate">
                                        {crumb.title}
                                    </Breadcrumb.Link>
                                </Breadcrumb.Item>
                            {/if}
                        {/each}
                    {:else}
                        {@const firstCrumb = crumbs[0]}
                        {@const lastCrumb = crumbs[crumbs.length - 1]}
                        {@const otherCrumbs = crumbs.slice(
                            1,
                            crumbs.length - 1,
                        )}
                        {#if firstCrumb}
                            <Breadcrumb.Item class="md:text-sm">
                                <Breadcrumb.Link href={firstCrumb.href}>
                                    {firstCrumb.title}
                                </Breadcrumb.Link>
                            </Breadcrumb.Item>
                            {#if crumbs.length > 1}
                                <Breadcrumb.Separator />
                            {/if}
                        {/if}
                        {#if crumbs.length > 2}
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger aria-label={m.navigation()}>
                                    <EllipsisIcon />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content>
                                    <DropdownMenu.Group>
                                        {#each otherCrumbs as crumb}
                                            <DropdownMenu.Item
                                                onclick={() => goto(crumb.href)}
                                            >
                                                {crumb.title}
                                            </DropdownMenu.Item>
                                        {/each}
                                    </DropdownMenu.Group>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                            <Breadcrumb.Separator />
                        {/if}
                        {#if lastCrumb && crumbs.length > 1}
                            <Breadcrumb.Item class="md:text-sm">
                                <Breadcrumb.Page class="truncate">
                                    {lastCrumb.title}
                                </Breadcrumb.Page>
                            </Breadcrumb.Item>
                        {/if}
                    {/if}
                {:else}
                    <Breadcrumb.Item class="md:text-sm">
                        <Breadcrumb.Page>{$title}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                {/if}
            </Breadcrumb.List>
        </Breadcrumb.Root>
        <div class="ml-auto flex items-center gap-2">
            <div class="flex items-center gap-2">
                {#if !page.data.authBypassed}
                    <!-- Both at every width: the bottom bar has no room for
                         either, so the header is the only place a phone can
                         see that something happened or reach the account. -->
                    <Notifications />
                    <UserMenu {user} />
                {/if}
            </div>
        </div>
    </div>
</header>
