<script lang="ts">
	import {
		ActivityIcon,
		AlertCircleIcon,
		CheckCircleIcon,
		LoaderCircleIcon,
		XIcon
	} from '@lucide/svelte';
	import { type JobJson } from 'bullmq';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
</script>

{#snippet alert({ job }: { job: JobJson })}
	<div class="flex w-full items-center justify-between gap-5" id="job-{job.id}">
		<div class="w-full">
			<div class="flex w-full items-center gap-2">
				{#if !job.finishedOn}
					<LoaderCircleIcon class="text-primary animate-spin" />
				{:else if job.failedReason}
					<AlertCircleIcon class="text-red-600" />
				{:else}
					<CheckCircleIcon class="text-green-600" />
				{/if}
				<div>
					<p class="text-sm">
						{job.name}
					</p>
					<p class="text-muted-foreground text-xs">
						{#if !job.finishedOn}
							Uploading...
						{:else if job.failedReason}
							{job.failedReason}
						{:else}
							Uploaded.
						{/if}
					</p>
				</div>
			</div>
		</div>
		<Button variant="outline" size="sm">
			<XIcon class="ml-auto" />
		</Button>
	</div>
{/snippet}

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({ variant: 'outline', size: 'icon' })}
		title="Show notifications"
	>
		<ActivityIcon class="h-[1.2rem] w-[1.2rem]" />
		<span class="sr-only">Show Notifications</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		{#if page.data.jobs}
			{@const jobs = page.data.jobs as JobJson[]}
			{#each jobs as job}
				<DropdownMenu.Item>
					{@render alert({
						job
					})}
				</DropdownMenu.Item>
			{/each}
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
