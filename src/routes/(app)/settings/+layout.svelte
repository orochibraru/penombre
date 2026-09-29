<script lang="ts">
	import {
		CogIcon,
		HardDriveIcon,
		MonitorDownIcon,
		PaletteIcon,
	} from "@lucide/svelte";
	import SectionTabs, {
		type SectionTab,
	} from "#lib/components/layout/section-tabs.svelte";
	import * as m from "#lib/paraglide/messages.js";
	import { page } from "$app/state";

	// A drive-only account has no drive of its own to measure.
	const tabs: SectionTab[] = $derived([
		{
			title: m.settings_nav_general(),
			url: "/settings",
			icon: CogIcon,
			isRoot: true,
		},
		{
			title: m.settings_nav_appearance(),
			url: "/settings/display",
			icon: PaletteIcon,
		},
		...(page.data.driveOnly
			? []
			: ([
					{
						title: m.settings_nav_storage(),
						url: "/settings/storage",
						icon: HardDriveIcon,
					},
				] satisfies SectionTab[])),
		{
			title: m.settings_nav_desktop(),
			url: "/settings/desktop",
			icon: MonitorDownIcon,
		},
	]);

	const { children } = $props();
</script>

<div class="w-full">
    <SectionTabs title={m.nav_settings()} {tabs} />
    {@render children()}
</div>
