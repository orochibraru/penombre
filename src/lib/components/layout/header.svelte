<script lang="ts">
	import { CloudUploadIcon, FolderPlusIcon } from '@lucide/svelte';
	import { page } from '$app/state';
	import NewFolder from '$lib/components/layout/dialogs/new-folder.svelte';
	import Upload from '$lib/components/layout/dialogs/upload.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { title } from '$lib/store/title';

	type Props = {
		newFolderOpen: boolean;
		uploadOpen: boolean;
	};

	let uploadLoading: boolean = $state(false);

	let { newFolderOpen = $bindable(false), uploadOpen = $bindable(false) }: Props = $props();
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
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					type="button"
					onclick={() => {
						newFolderOpen = true;
					}}
				>
					<FolderPlusIcon class="h-[1.2rem] w-[1.2rem]" />
					<span class="hidden md:block">New Folder</span>
				</Button>
				<Button
					variant="default"
					type="button"
					loading={uploadLoading}
					onclick={() => {
						uploadOpen = true;
					}}
				>
					{#if !uploadLoading}
						<CloudUploadIcon class="h-[1.2rem] w-[1.2rem]" />
						<span class="hidden md:block">Upload</span>
					{:else}
						<CloudUploadIcon class="h-[1.2rem] w-[1.2rem] lg:hidden" />
						<span class="hidden md:block">Uploading</span>
					{/if}
				</Button>
			</div>
		</div>
	</div>
</header>

<NewFolder bind:open={newFolderOpen} />
<Upload bind:open={uploadOpen} bind:loading={uploadLoading} />
