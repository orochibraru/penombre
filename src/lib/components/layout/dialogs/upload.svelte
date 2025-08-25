<script lang="ts">
	import { XIcon } from '@lucide/svelte';
	import { type IAudioMetadata, parseBlob } from 'music-metadata';
	import { toast } from 'svelte-sonner';
	import { filesProxy, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { api, type UploadBody, type UploadResult } from '$lib/api';
	import { uploadFile } from '$lib/api/helpers/storage';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import {
		displaySize,
		FileDropZone,
		type FileDropZoneProps
	} from '$lib/components/ui/file-drop-zone';
	import { uploadSchema } from '$lib/schemas/upload';
	import { uploadedItems, uploadingItems } from '$lib/store/upload';
	import { cn } from '$lib/utils';

	type Props = {
		open: boolean;
		loading: boolean;
	};

	const concurrency = 10;

	let { open = $bindable(false), loading = $bindable(false) }: Props = $props();

	const superform = superForm(page.data.uploadForm, {
		validators: valibotClient(uploadSchema)
	});

	const files = filesProxy(superform, 'attachments');

	const onUpload: FileDropZoneProps['onUpload'] = async (uploadedFiles) => {
		// we use set instead of an assignment since it accepts a File[]
		files.set([...Array.from($files), ...uploadedFiles]);
	};

	function removeFile(index: number) {
		// we use set instead of an assignment since it accepts a File[]
		files.set([...Array.from($files).slice(0, index), ...Array.from($files).slice(index + 1)]);
	}

	const onFileRejected: FileDropZoneProps['onFileRejected'] = async ({ reason, file }) => {
		toast.error(`${file.name} failed to upload.`, { description: reason });
	};

	type FullResult = {
		data: UploadResult;
		file: File;
	};

	type ErrorResult = FullResult & { error: string };
	let uploadErrors: ErrorResult[] = $state([]);

	function fileNameWithoutFolder(name: string) {
		return name.replace(`${page.params.path}/`, '');
	}

	async function resultCallback(results: FullResult[]) {
		const uploadPromises: Promise<void>[] = [];

		for (const result of results) {
			try {
				const promise = new Promise<boolean>((resolve) => {
					const xhr = new XMLHttpRequest();
					const finalUrl = `${page.url.origin}/p?url=${result.data.presignedUrl}`;
					xhr.open('PUT', finalUrl);
					xhr.setRequestHeader('Content-Type', result.file.type);
					console.log(result.data);

					for (const key in result.data.metadata) {
						if (result.data.metadata[key]) {
							xhr.setRequestHeader(`x-amz-meta-${key.toLowerCase()}`, result.data.metadata[key]);
						}
					}

					xhr.upload.onprogress = (event) => {
						if (event.lengthComputable) {
							const percentLoaded = (event.loaded / event.total) * 100;
							$uploadingItems[fileNameWithoutFolder(result.data.finalName)] = percentLoaded;
						}
					};

					xhr.onload = () => {
						if (xhr.status >= 200 && xhr.status < 300) {
							resolve(true);
						} else {
							console.error(
								`Upload failed for ${result.data.finalName}. Status: ${xhr.status}, Response: ${xhr.responseText}`
							);

							uploadErrors.push({
								error: xhr.responseText || 'Upload failed.',
								...result
							});

							resolve(false);
						}
					};

					xhr.onerror = () => {
						console.error(`Network error during upload for ${result.data.finalName}`);
						uploadErrors.push({
							error: xhr.responseText || 'Network error',
							...result
						});

						resolve(false);
					};

					xhr.onabort = () => {
						console.log(`Upload aborted for ${result.data.finalName}`);
						uploadErrors.push({
							error: xhr.responseText || 'Request aborted',
							...result
						});
						resolve(false);
					};

					xhr.send(result.file);
				})
					.then(async (res) => {
						if (res === false) {
							delete $uploadingItems[fileNameWithoutFolder(result.data.finalName)];
							return;
						}

						const fullPath = page.params.path
							? `${page.params.path}/${fileNameWithoutFolder(result.data.finalName)}`
							: fileNameWithoutFolder(result.data.finalName);
						const { data: file } = await api.GET('/api/v1/storage/objects/item', {
							params: {
								query: {
									item: fullPath
								}
							}
						});

						if (file?.size && file.size > 0) {
							file.key = fileNameWithoutFolder(file.key);
							$uploadedItems[fileNameWithoutFolder(result.data.finalName)] = file;

							const fileIndex = Array.from($files).indexOf(result.file);

							if (fileIndex > -1) {
								removeFile(fileIndex);
							}
						}
					})
					.catch(() => {
						delete $uploadingItems[fileNameWithoutFolder(result.data.finalName)];
					});

				uploadPromises.push(promise);
			} catch (e) {
				toast.error(`Upload failed for ${fileNameWithoutFolder(result.data.finalName)}.`);
				delete $uploadingItems[fileNameWithoutFolder(result.data.finalName)];
			}
		}

		while (uploadPromises.length) {
			await Promise.all(uploadPromises.splice(0, concurrency));
		}
	}

	async function handleUpload() {
		loading = true;
		const results: FullResult[] = [];

		const uploadMetadataPromises = [];
		for (const file of $files) {
			const isMusic = file.type.startsWith('audio/');
			// biome-ignore lint/suspicious/noExplicitAny: This is already annoying enough as it is
			let metadata = new Map<string, any>();

			if (isMusic) {
				const musicMeta = await parseBlob(file);

				for (const cat of Object.keys(musicMeta) as Array<keyof IAudioMetadata>) {
					// biome-ignore lint/suspicious/noExplicitAny: This is already annoying enough as it is
					const category: Record<string, any> = musicMeta[cat];
					metadata.set(cat, category);
				}
			}

			const object: UploadBody = {
				key: file.name,
				type: file.type,
				folder: page.params.path ?? '',
				metadata: metadata
			};

			const promise = await uploadFile(object)
				.then((res) => {
					if (!res.data) {
						throw new Error('No data returned from upload endpoint');
					}

					const result: FullResult = {
						data: {
							finalName: res.data.finalName,
							presignedUrl: res.data.presignedUrl,
							metadata: res.data.metadata
						},
						file
					};

					results.push(result);
					$uploadingItems[fileNameWithoutFolder(result.data.finalName)] = 1;

					return res;
				})
				.catch((e) => {
					console.error(e);
					toast.error('Failed to schedule files for upload.');
					loading = false;
					throw e;
				});

			uploadMetadataPromises.push(promise);
		}

		const globalpromise = Promise.all(uploadMetadataPromises).finally(async () => {
			open = false;
			await invalidateAll();
			files.set([]);

			void resultCallback(results).finally(() => {
				loading = false;

				if (uploadErrors.length > 0) {
					console.error(uploadErrors);
					toast.error('Failed to upload some items');
				} else {
					toast.success('Successfully uploaded all items');
				}
			});
		});

		toast.promise(globalpromise, {
			loading: 'Queuing files for upload',
			success: 'Files queued for upload',
			error: 'Failed to queue files for upload'
		});
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[70%] pb-16 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
		<Dialog.Header>
			<Dialog.Title>Upload new files</Dialog.Title>
			<Dialog.Description>
				Drag n' Drop or click to select the files you want to upload.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			enctype="multipart/form-data"
			class="flex max-h-[50vh] w-full flex-col gap-2 overflow-y-auto px-5"
		>
			<fieldset disabled={loading}>
				<input type="hidden" name="rootFolder" value={page.params.path} />
				<FileDropZone {onUpload} {onFileRejected} fileCount={$files.length} class="mb-5" />
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
											removeFile(i);
										}}
									>
										<XIcon />
									</Button>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<Dialog.Footer class="fixed bottom-0 left-0 w-full border-t p-5">
					<Button
						type="button"
						class="w-full"
						{loading}
						disabled={$files.length === 0}
						onclick={() => handleUpload()}
					>
						Upload
						{#if $files.length > 0}
							{$files.length} files
						{/if}
					</Button>
				</Dialog.Footer>
			</fieldset>
		</form>
	</Dialog.Content>
</Dialog.Root>
