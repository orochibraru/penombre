<script lang="ts">
    import { EllipsisIcon } from "@lucide/svelte";
    import { MediaQuery } from "svelte/reactivity";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Separator } from "$lib/components/ui/separator/index";
    import * as Sidebar from "$lib/components/ui/sidebar/index";
    import { title } from "$lib/store/title";
    import type { BreadCrumb } from "$lib/utils";
    import type { User } from "better-auth";
    import UserMenu from "$lib/components/layout/user-menu.svelte";

    type Props = {
        user: User;
    };

    let { user }: Props = $props();

    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

<header
    class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
    <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Sidebar.Trigger class="-ml-1" />
        <Separator
            orientation="vertical"
            class="mx-2 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb.Root>
            <Breadcrumb.List>
                {#if page.data.crumbs}
                    {@const crumbs: BreadCrumb[] = page.data.crumbs}
                    {#if isDesktop.current}
                        {#each crumbs as crumb}
                            {@const index = crumbs.indexOf(crumb)}
                            {#if index !== crumbs.length && index !== 0}
                                <Breadcrumb.Separator />
                            {/if}
                            <Breadcrumb.Item class="md:text-sm">
                                <Breadcrumb.Link href={crumb.href}>
                                    {crumb.title}
                                </Breadcrumb.Link>
                            </Breadcrumb.Item>
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
                            <Breadcrumb.Separator />
                        {/if}
                        {#if crumbs.length > 2}
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
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
                        {#if lastCrumb}
                            <Breadcrumb.Item class="md:text-sm">
                                <Breadcrumb.Link href={lastCrumb.href}>
                                    {lastCrumb.title}
                                </Breadcrumb.Link>
                            </Breadcrumb.Item>
                        {/if}
                    {/if}
                {:else}
                    <Breadcrumb.Item class="md:text-sm">
                        <Breadcrumb.Link>{$title}</Breadcrumb.Link>
                    </Breadcrumb.Item>
                {/if}
            </Breadcrumb.List>
        </Breadcrumb.Root>
        <div class="ml-auto flex items-center gap-2">
            <div class="flex items-center gap-2">
                <div class="hidden md:block">
                    <UserMenu {user} />
                </div>
            </div>
        </div>
    </div>
</header>
