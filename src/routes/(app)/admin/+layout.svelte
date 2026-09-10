<script lang="ts">
	import {
		ActivityIcon,
		CogIcon,
		HardDriveIcon,
		UsersIcon,
	} from "@lucide/svelte";
	import SectionTabs, {
		type SectionTab,
	} from "$lib/components/layout/section-tabs.svelte";
	import * as m from "$lib/paraglide/messages.js";

	const tabs: SectionTab[] = [
		{
			title: m.admin_nav_dashboard(),
			url: "/admin",
			icon: CogIcon,
			isRoot: true,
		},
		{ title: m.admin_nav_users(), url: "/admin/users", icon: UsersIcon },
		{
			title: m.admin_nav_storage(),
			url: "/admin/storage",
			icon: HardDriveIcon,
		},
		{
			title: m.admin_nav_activity(),
			url: "/admin/activity",
			icon: ActivityIcon,
		},
	];

	const { children } = $props();
</script>

<div class="w-full">
    <SectionTabs title={m.admin()} {tabs} />
    {@render children()}
</div>
