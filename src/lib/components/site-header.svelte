<script lang="ts">
	import Darkmode from '$lib/components/darkmode.svelte';
	import Notifications from '$lib/components/notifications.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { title } from '$lib/store/title';
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">
			{$title}
		</h1>
		<div class="ml-auto flex items-center gap-2">
			<Darkmode />
			<Notifications />
		</div>
	</div>
</header>
