<script lang="ts">
	import { CogIcon, HardDriveIcon, PaletteIcon } from "@lucide/svelte";
	import SectionTabs, {
		type SectionTab,
	} from "$lib/components/layout/section-tabs.svelte";
	import * as m from "$lib/paraglide/messages.js";

	const tabs: SectionTab[] = [
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
		{
			title: m.settings_nav_storage(),
			url: "/settings/storage",
			icon: HardDriveIcon,
		},
	];

	const { children } = $props();
</script>

<div class="w-full">
    <SectionTabs title={m.nav_settings()} {tabs} />
    {@render children()}
</div>
