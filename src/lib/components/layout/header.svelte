<script lang="ts">
	import { CloudUploadIcon, FolderPlusIcon } from '@lucide/svelte';
	import { page } from '$app/state';
	import Activity from '$lib/components/layout/activity.svelte';
	import Notifications from '$lib/components/layout/notifications.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';

	type Props = {
		newFolderOpen: boolean;
	};

	let { newFolderOpen = $bindable(false) }: Props = $props();
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />

		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#if page.data.crumbs}
					{#each page.data.crumbs as crumb}
						{@const index = page.data.crumbs.indexOf(crumb)}
						{#if index !== page.data.crumbs.length && index !== 0}
							<Breadcrumb.Separator />
						{/if}
						<Breadcrumb.Item>
							<Breadcrumb.Link href={crumb.href}>
								{crumb.title}
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
			<Notifications />
			<Activity />
			<div class="flex items-center gap-2">
				<Button href={route('/upload')} class="h-full text-sm">
					Upload
					<CloudUploadIcon />
				</Button>
				<Button
					variant="outline"
					class="h-full text-sm"
					type="button"
					onclick={() => {
						newFolderOpen = true;
					}}
				>
					New Folder
					<FolderPlusIcon class="h-5 w-5" />
				</Button>
			</div>
		</div>
	</div>
</header>
