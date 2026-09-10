<script lang="ts">
	import {
		ActivityIcon,
		MonitorIcon,
		ShieldIcon,
		UserIcon,
	} from "@lucide/svelte";
	import SectionTabs, {
		type SectionTab,
	} from "$lib/components/layout/section-tabs.svelte";
	import * as m from "$lib/paraglide/messages.js";

	const tabs: SectionTab[] = [
		{
			title: m.account_nav_personal(),
			url: "/account",
			icon: UserIcon,
			isRoot: true,
		},
		{
			title: m.account_nav_security(),
			url: "/account/security",
			icon: ShieldIcon,
		},
		{
			title: m.account_nav_sessions(),
			url: "/account/sessions",
			icon: MonitorIcon,
		},
		{
			title: m.account_nav_activity(),
			url: "/account/activity",
			icon: ActivityIcon,
		},
	];

	const { children } = $props();
</script>

<div class="w-full">
    <SectionTabs title={m.account()} {tabs} />
    {@render children()}
</div>
