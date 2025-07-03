<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PageTitle from '$lib/components/page-title.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		displaySize,
		FileDropZone,
		type FileDropZoneProps
	} from '$lib/components/ui/file-drop-zone';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { route } from '$lib/ROUTES';
	import { title } from '$lib/store/title';
	import { cn } from '$lib/utils';
	import { FileWarningIcon, XIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { filesProxy, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import type { CustomReq } from './model';
	import { schema } from './schema';

	let { data } = $props();

	$title = 'Upload';

	const superform = superForm(data.form, {
		validators: valibotClient(schema)
	});

	const { enhance, message, errors, submitting, delayed } = superform;

	const loading = $derived($submitting || $delayed);

	const requests: CustomReq[] = $state([]);

	message.subscribe((message) => {
		if (message) {
			if (message.length > 0) {
				// is array
				for (const msg of message) {
					requests.push(msg);
				}
			}
			if (page.status > 204) {
				toast.error(message.text, {
					description: 'Failed to upload some attachments.'
				});
				return;
			}

			toast.success(message.text, {
				description: 'Your attachments were uploaded.'
			});

			goto(route('/'));
		}
	});

	const onUpload: FileDropZoneProps['onUpload'] = async (uploadedFiles) => {
		// we use set instead of an assignment since it accepts a File[]
		files.set([...Array.from($files), ...uploadedFiles]);
	};

	const onFileRejected: FileDropZoneProps['onFileRejected'] = async ({ reason, file }) => {
		toast.error(`${file.name} failed to upload.`, { description: reason });
	};

	const files = filesProxy(superform, 'attachments');
</script>

<section>
	<PageTitle>Upload Files</PageTitle>
	<form method="POST" enctype="multipart/form-data" use:enhance class="flex w-full flex-col gap-2">
		<fieldset disabled={loading}>
			<FileDropZone
				{onUpload}
				{onFileRejected}
				aria-invalid={$errors.attachments ? 'true' : undefined}
				fileCount={$files.length}
				class="mb-5"
			/>
			<input name="attachments" type="file" bind:files={$files} class="hidden" />
			<div class="mb-5 flex flex-col gap-3">
				{#each Array.from($files) as file, i (file.name)}
					{@const hasError = requests.find((req) => req.file === file.name && req.error === true)}
					<div>
						<div
							class={cn(
								'flex place-items-center justify-between gap-3 rounded-xl border p-3',
								hasError ? 'border-red-600' : ''
							)}
						>
							<div class="flex flex-col">
								<div class="flex items-center gap-2">
									<span class="text-sm">{file.name}</span>
									{#if hasError}
										<p class="text-xs text-red-600">Failed to upload.</p>
									{/if}
								</div>
								<span class="text-muted-foreground text-xs">{displaySize(file.size)}</span>
							</div>
							<div class="flex items-center gap-2">
								{#if hasError}
									<Tooltip.Provider>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<FileWarningIcon class="text-red-600" />
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p>Failed to upload this item.</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								{/if}
								<Button
									variant="outline"
									size="icon"
									onclick={() => {
										// we use set instead of an assignment since it accepts a File[]
										files.set([
											...Array.from($files).slice(0, i),
											...Array.from($files).slice(i + 1)
										]);
									}}
								>
									<XIcon />
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<Button type="submit" class="w-full" {loading} disabled={$files.length === 0}>Upload</Button>
		</fieldset>
	</form>
</section>
