<script lang="ts">
	import { goto } from '$app/navigation';
	import PageTitle from '$lib/components/page-title.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		displaySize,
		FileDropZone,
		type FileDropZoneProps
	} from '$lib/components/ui/file-drop-zone';
	import { route } from '$lib/ROUTES';
	import { XIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { filesProxy, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { schema } from './schema';

	let { data } = $props();

	const superform = superForm(data.form, {
		validators: valibotClient(schema)
	});

	const { enhance, message, errors, submitting, delayed } = superform;

	const loading = $derived($submitting || $delayed);

	message.subscribe((message) => {
		if (message) {
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
					<div class="flex place-items-center justify-between gap-3 rounded-xl border p-3">
						<div class="flex flex-col">
							<span class="text-sm">{file.name}</span>
							<span class="text-muted-foreground text-xs">{displaySize(file.size)}</span>
						</div>
						<Button
							variant="outline"
							size="icon"
							onclick={() => {
								// we use set instead of an assignment since it accepts a File[]
								files.set([...Array.from($files).slice(0, i), ...Array.from($files).slice(i + 1)]);
							}}
						>
							<XIcon />
						</Button>
					</div>
				{/each}
			</div>
			<Button type="submit" class="w-full" {loading} disabled={$files.length === 0}>Upload</Button>
		</fieldset>
	</form>
</section>
