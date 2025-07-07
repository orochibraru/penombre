<script lang="ts">
	import { page } from '$app/state';
	import Darkmode from '$lib/components/darkmode.svelte';
	import Notifications from '$lib/components/notifications.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />

		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#if page.data.folders}
					{#each page.data.folders as folder}
						{@const index = page.data.folders.indexOf(folder)}
						{#if index !== page.data.folders.length && index !== 0}
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							<Breadcrumb.Link
								href={route('/browse/[...path]', {
									path: [
										page.data.folders
											.splice(index + 1, page.data.folders.length - (index + 1))
											.join('/')
									]
								})}
							>
								{folder}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
					{/each}
				{:else}
					<Breadcrumb.Item>
						<Breadcrumb.Link>{$title}</Breadcrumb.Link>
					</Breadcrumb.Item>
				{/if}
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<div class="ml-auto flex items-center gap-2">
			<Darkmode />
			<Notifications />
		</div>
	</div>
</header>
