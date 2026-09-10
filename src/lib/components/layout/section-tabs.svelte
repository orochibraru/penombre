<script lang="ts" module>
	import type { Component } from "svelte";
	import type { Pathname } from "$app/types";

	export interface SectionTab {
		title: string;
		/** Typed against the router so a renamed route fails the build. */
		url: Pathname;
		icon: Component;
		/** Only active on an exact match — for the section's index route. */
		isRoot?: boolean;
	}
</script>

<script lang="ts">
	import { page } from "$app/state";
	import { customMenu } from "$lib/store/custom-menu";
	import { cn } from "$lib/utils";

	interface Props {
		title: string;
		tabs: SectionTab[];
	}

	const { title, tabs }: Props = $props();

	// The mobile bottom bar opens a drawer from this store, so the tabs stay
	// reachable on a phone where the tab strip is a horizontal scroll.
	$effect(() => {
		customMenu.set({ title, items: tabs });
		return () => customMenu.set(null);
	});

	const isActive = (tab: SectionTab) =>
		tab.isRoot
			? page.url.pathname === tab.url
			: page.url.pathname.startsWith(tab.url);
</script>

<!--
  Sections used to mount a second sidebar on top of the app's, which meant
  stacking two fixed panels and hiding one. Tabs keep the main nav in place,
  so there is one navigation model instead of two.
-->
<div class="mb-5 flex flex-col gap-3">
    <h1 class="text-xl font-semibold tracking-tight">{title}</h1>
    <nav
        class="border-border flex flex-wrap gap-1 border-b"
        aria-label={title}
    >
        {#each tabs as tab (tab.url)}
            {@const active = isActive(tab)}
            {@const Icon = tab.icon}
            <a
                href={tab.url}
                aria-current={active ? "page" : undefined}
                class={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
                    active
                        ? "border-primary text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground border-transparent",
                )}
            >
                <Icon class="size-4" />
                {tab.title}
            </a>
        {/each}
    </nav>
</div>
