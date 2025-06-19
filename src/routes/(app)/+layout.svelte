<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	const { children, data } = $props();
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" user={data.user} />
	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
