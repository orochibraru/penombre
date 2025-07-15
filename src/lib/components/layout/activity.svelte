<script lang="ts">
	import {
		ActivityIcon,
		AlertCircleIcon,
		CheckCircleIcon,
		LoaderCircleIcon,
		XIcon
	} from '@lucide/svelte';
	import { type JobJson } from 'bullmq';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/button/button.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { route } from '$lib/ROUTES';
	import { cn } from '$lib/utils';

	let jobs: JobJson[] = $state([]);
	let ongoing: boolean = $state(false);

	onMount(() => {
		// Connect to our SSE endpoint
		const eventSource = new EventSource(route('GET /api/int/upload'));

		// Handle incoming messages
		eventSource.onmessage = (event) => {
			// Parse the data and update our reactive variable
			const data = JSON.parse(event.data);
			jobs = data;

			const ongoingJobs = jobs.filter((job) => {
				if (job.finishedOn === null || job.finishedOn === undefined) {
					return job;
				}
			});

			if (ongoingJobs.length > 0) {
				ongoing = true;
			} else {
				ongoing = false;
			}
		};

		// Handle any errors
		eventSource.onerror = (err) => {
			console.error('EventSource failed:', err);
			eventSource.close();
		};

		// Cleanup when the component is destroyed
		return () => {
			eventSource.close();
		};
	});

	async function deletejob(job: JobJson) {
		const req = fetch(route('DELETE /api/int/upload/[jobId]', { jobId: job.id }), {
			method: 'DELETE'
		});

		toast.promise(req, {
			loading: `Removing activity item ${job.name}`,
			success: `Removed activity item ${job.name}`,
			error: `Failed to remove activity item ${job.name}`
		});
	}

	async function cleanupQueue() {
		const req = fetch(route('DELETE /api/int/upload'), {
			method: 'DELETE'
		})
			.then((res) => {
				if (res.ok) {
					jobs = [];
				}

				return res;
			})
			.catch((e) => {
				console.error(e);
				throw e;
			});

		toast.promise(req, {
			loading: 'Cleaning up activity',
			success: 'Activity has been cleaned up',
			error: 'Failed to cleanup activity'
		});
	}
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
		<Button variant="outline" size="sm" onclick={() => deletejob(job)}>
			<XIcon class="ml-auto" />
		</Button>
	</div>
{/snippet}

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({ variant: 'outline', size: 'icon' })}
		title="Show notifications"
	>
		<ActivityIcon
			class={cn(
				'h-[1.2rem] w-[1.2rem]',
				ongoing ? 'text-primary animate-pulse' : 'text-foreground'
			)}
		/>
		<span class="sr-only">Show Notifications</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="flex max-h-90 min-w-96 flex-col overflow-y-auto">
		{#if jobs && jobs.length > 0}
			<div class="mb-3 flex items-center justify-between gap-5 px-2">
				<h5 class="text-xs uppercase">Recent Activity</h5>
				<Button
					variant="ghost"
					class="w-auto self-end text-xs"
					size="sm"
					onclick={() => cleanupQueue()}
				>
					Cleanup
				</Button>
			</div>
			{#each jobs as job}
				<DropdownMenu.Item>
					{@render alert({
						job
					})}
				</DropdownMenu.Item>
			{/each}
		{:else}
			<h5 class="text-xs uppercase">No Recent Activity</h5>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
