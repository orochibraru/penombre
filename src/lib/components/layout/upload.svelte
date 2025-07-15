<script lang="ts">
	import { XIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { filesProxy, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		displaySize,
		FileDropZone,
		type FileDropZoneProps
	} from '$lib/components/ui/file-drop-zone';
	import { route } from '$lib/ROUTES';
	import { uploadSchema } from '$lib/schemas/upload';
	import { cn } from '$lib/utils';

	type Props = {
		open: boolean;
	};

	let { open = $bindable(false) }: Props = $props();

	const superform = superForm(page.data.uploadForm, {
		validators: valibotClient(uploadSchema)
	});

	const { enhance, message, errors, submitting, delayed } = superform;

	const loading = $derived($submitting || $delayed);

	message.subscribe((message) => {
		if (message) {
			if (page.status > 204) {
				toast.error(message.text, {
					description: 'Failed to schedule some attachments.'
				});
				return;
			}

			toast.success(message.text, {
				description: 'Your attachments are sheduled for upload.'
			});

			open = false;
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

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-7xl">
		<Dialog.Header>
			<Dialog.Title>Upload new files</Dialog.Title>
			<Dialog.Description>
				Drag n' Drop or click to select the files you want to upload.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			enctype="multipart/form-data"
			action={route('POST /api/int/upload')}
			use:enhance
			class="flex w-full flex-col gap-2"
		>
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
						<div>
							<div
								class={cn('flex place-items-center justify-between gap-3 rounded-xl border p-3')}
							>
								<div class="flex flex-col">
									<div class="flex items-center gap-2">
										<span class="text-sm">{file.name}</span>
									</div>
									<span class="text-muted-foreground text-xs">{displaySize(file.size)}</span>
								</div>
								<div class="flex items-center gap-2">
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
				<Button type="submit" class="w-full" {loading} disabled={$files.length === 0}>Upload</Button
				>
			</fieldset>
		</form>
	</Dialog.Content>
</Dialog.Root>
