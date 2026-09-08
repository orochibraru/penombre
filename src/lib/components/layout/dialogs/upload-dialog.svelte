<script lang="ts">
	import { FolderIcon, XIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { filesProxy, superForm } from "sveltekit-superforms";
	import { zod4Client } from "sveltekit-superforms/adapters";
	import { invalidate } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { api, type ObjectItem, type UploadResult } from "$lib/api";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		displaySize,
		FileDropZone,
		type FileDropZoneProps,
	} from "$lib/components/ui/file-drop-zone";
	import * as m from "$lib/paraglide/messages.js";
	import { uploadSchema } from "$lib/schemas/upload";
	import {
		pendingUploadFiles,
		preparingUpload,
		uploadedItems,
		uploadingItems,
		uploadingItemsNames,
		uploadStats,
	} from "$lib/store/upload";
	import { cn } from "$lib/utils";
	import {
		createFoldersForUpload,
		createUploadMetadata,
		type FileWithPath,
		type FullResult,
		groupFilesByFolder,
	} from "./upload-dialog.svelte.js";

	interface Props {
		open: boolean;
		loading: boolean;
	}

	/**
	 * Comprehensive list of OS-specific system files to skip during folder uploads.
	 * These files are automatically created by operating systems and typically should not be uploaded.
	 */
	const SKIP_OS_FILES = new Set([
		// macOS
		".DS_Store",
		".AppleDouble",
		".LSOverride",
		"Icon\r", // Icon file with carriage return
		"Icon", // Icon file without carriage return
		".Spotlight-V100",
		".Trashes",
		".VolumeIcon.icns",
		".com.apple.timemachine.donotpresent",
		".fseventsd",
		".TemporaryItems",
		".apdisk",
		".DocumentRevisions-V100",
		".PKInstallSandboxManager",
		// Windows
		"Thumbs.db",
		"ehthumbs.db",
		"ehthumbs_vista.db",
		"Desktop.ini",
		"$RECYCLE.BIN",
		"System Volume Information",
		// Linux
		".directory",
		".Trash-1000", // Common user trash
		// General version control (usually want to skip)
		".git",
		".svn",
		".hg",
		".bzr",
	]);

	/**
	 * Check if a file should be skipped based on OS-specific patterns.
	 */
	function shouldSkipFile(fileName: string): boolean {
		// Check exact matches
		if (SKIP_OS_FILES.has(fileName)) {
			return true;
		}

		// Check patterns
		if (
			fileName.startsWith("._") || // macOS resource forks
			fileName.startsWith(".Trash-") || // Linux trash folders
			fileName.startsWith("~$") // Windows temporary Office files
		) {
			return true;
		}

		return false;
	}

	const BATCH_SIZE = 25;
	const MAX_RETRIES = 3;
	const RETRY_BASE_DELAY_MS = 1000;

	// Per-file byte tracking for speed/ETA calculation
	const fileBytesUploaded = new Map<string, number>();

	function updateUploadSpeed() {
		const stats = $uploadStats;
		const elapsed = (Date.now() - stats.startTime) / 1000;
		if (elapsed <= 0) {
			return;
		}

		const totalUploaded = Array.from(fileBytesUploaded.values()).reduce(
			(sum, b) => sum + b,
			0,
		);
		const speed = totalUploaded / elapsed;
		const remainingBytes = stats.totalBytes - totalUploaded;
		const eta = speed > 0 ? remainingBytes / speed : 0;

		$uploadStats = {
			...stats,
			uploadedBytes: totalUploaded,
			speed,
			eta: Math.max(0, Math.round(eta)),
		};
	}

	onMount(() => {
		// Reset the upload stores when the component is mounted
		uploadingItems.set({});
		uploadingItemsNames.set({});
		uploadedItems.set({});
		if (!page.data.uploadForm) {
			throw new Error("uploadForm data is required");
		}
	});

	let { open = $bindable(false), loading = $bindable(false) }: Props = $props();

	// Pick up pending files from drag/drop when dialog opens
	$effect(() => {
		if (open && $pendingUploadFiles.length > 0) {
			files.set([...Array.from($files), ...$pendingUploadFiles]);
			pendingUploadFiles.set([]);
		}
	});

	const superform = superForm(page.data.uploadForm, {
		validators: zod4Client(uploadSchema),
	});

	const files = filesProxy(superform, "attachments");

	// Track files from folder uploads with their relative paths
	let folderFiles = $state<FileWithPath[]>([]);

	const onUpload: FileDropZoneProps["onUpload"] = (uploadedFiles) => {
		// we use set instead of an assignment since it accepts a File[]
		files.set([...Array.from($files), ...uploadedFiles]);
	};

	const onFolderUpload: FileDropZoneProps["onFolderUpload"] = (
		uploadedFiles,
	) => {
		// Files from folder selection have webkitRelativePath set
		// Filter out OS-specific system files
		const filesWithPaths: FileWithPath[] = uploadedFiles
			.filter((file) => {
				const fileName = file.name;
				if (shouldSkipFile(fileName)) {
					return false;
				}
				return true;
			})
			.map((file) => {
				const f = file as FileWithPath;
				f.relativePath = file.webkitRelativePath || file.name;
				return f;
			});

		folderFiles = [...folderFiles, ...filesWithPaths];
	};

	// Combined file count for display
	const totalFileCount = $derived(
		Array.from($files).length + folderFiles.length,
	);

	function removeFile(index: number) {
		// we use set instead of an assignment since it accepts a File[]
		files.set([
			...Array.from($files).slice(0, index),
			...Array.from($files).slice(index + 1),
		]);
	}

	function removeFolderFile(index: number) {
		folderFiles = [
			...folderFiles.slice(0, index),
			...folderFiles.slice(index + 1),
		];
	}

	function removeFileByRef(fileToRemove: File) {
		files.set(Array.from($files).filter((f) => f !== fileToRemove));
		folderFiles = folderFiles.filter((f) => f !== fileToRemove);
	}

	const onFileRejected: FileDropZoneProps["onFileRejected"] = ({
		reason,
		file,
	}) => {
		toast.error(m.toast_file_upload_failed({ name: file.name }), {
			description: reason,
		});
	};

	type ErrorResult = FullResult & { error: string };
	let uploadErrors: ErrorResult[] = $state([]);

	function fileNameWithoutFolder(name: string) {
		return name.replace(`${page.params.path}/`, "");
	}

	async function cleanup(fileName: string) {
		// Delete the file
		const { error: deleteError } = await api.DELETE(
			"/api/v1/storage/file/{id}",
			{
				params: {
					path: {
						id: encodeURIComponent(fileNameWithoutFolder(fileName)),
					},
				},
			},
		);

		const tmp = $uploadingItems;

		// The below doesn't work since Svelte doesn't track changes to nested objects in stores
		delete tmp[fileNameWithoutFolder(fileName)];

		// So we do this instead
		$uploadingItems = { ...tmp };

		const tmp2 = $uploadedItems;
		delete tmp2[fileNameWithoutFolder(fileName)];
		$uploadedItems = { ...tmp2 };

		await invalidate("app:files");

		const failedUpload = uploadErrors.find(
			(e) => e.data.finalName === fileName,
		);
		if (failedUpload) {
			removeFileByRef(failedUpload.file);
		}
	}

	/**
	 * Uploads a single file via XHR with retry logic.
	 * Returns true on success, throws on permanent failure.
	 */
	function uploadSingleFile(
		result: FullResult,
		_attempt = 1,
	): Promise<boolean> {
		return new Promise<boolean>((finish, fail) => {
			const xhr = new XMLHttpRequest();
			const finalUrl = resolve("/api/v1/storage/file/[id]/upload", {
				id: result.data.metadata.id,
			});
			xhr.open("POST", finalUrl);
			xhr.withCredentials = true;

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					if (
						uploadErrors.some((e) => e.data.finalName === result.data.finalName)
					) {
						delete $uploadingItems[
							fileNameWithoutFolder(result.data.finalName)
						];
						return;
					}
					const percentLoaded = (event.loaded / event.total) * 100;
					$uploadingItems[fileNameWithoutFolder(result.data.finalName)] =
						percentLoaded;

					// Track bytes for speed/ETA
					fileBytesUploaded.set(result.data.finalName, event.loaded);
					updateUploadSpeed();
				}
			};

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					return finish(true);
				}
				return fail({
					status: xhr.status,
					response: xhr.responseText || "Upload failed.",
				});
			};

			xhr.onerror = () =>
				fail({
					status: 0,
					response: xhr.responseText || "Network error",
				});

			xhr.onabort = () =>
				fail({
					status: 0,
					response: xhr.responseText || "Request aborted",
				});

			const formData = new FormData();
			formData.append("file", result.file);
			xhr.send(formData);

			if (xhr.readyState === XMLHttpRequest.DONE) {
				finish(true);
			}
		});
	}

	/**
	 * Uploads a single file with retries, then fetches its metadata on success.
	 */
	async function uploadWithRetry(result: FullResult): Promise<void> {
		let lastError: { status: number; response: string } | undefined;

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				// Reset progress on retry
				if (attempt > 1) {
					$uploadingItems[fileNameWithoutFolder(result.data.finalName)] = 0;
				}

				const success = await uploadSingleFile(result, attempt);

				if (success) {
					// Mark file bytes as fully uploaded
					fileBytesUploaded.set(result.data.finalName, result.file.size);

					// Update completed file count
					$uploadStats = {
						...$uploadStats,
						completedFiles: $uploadStats.completedFiles + 1,
					};
					updateUploadSpeed();

					// Fetch file metadata after successful upload
					const { data: fileData } = await api.GET(
						"/api/v1/storage/file/{id}",
						{
							params: {
								path: {
									id: encodeURIComponent(result.data.finalName),
								},
							},
						},
					);

					if (fileData?.data) {
						const file = fileData.data as unknown as ObjectItem;
						file.key = fileNameWithoutFolder(file.key);
						$uploadedItems[fileNameWithoutFolder(result.data.finalName)] = file;

						const tmp = $uploadingItems;
						delete tmp[fileNameWithoutFolder(result.data.finalName)];
						$uploadingItems = { ...tmp };

						removeFileByRef(result.file);
					}
					return;
				}
			} catch (e) {
				lastError = e as { status: number; response: string };

				if (attempt < MAX_RETRIES) {
					const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
					await new Promise((r) => setTimeout(r, delay));
				}
			}
		}

		// All retries exhausted
		uploadErrors.push({
			error: lastError?.response || "Upload failed after retries.",
			...result,
		});
		await cleanup(result.data.finalName);
	}

	/**
	 * Processes upload results in batches to avoid overwhelming the browser.
	 */
	async function resultCallback(results: FullResult[]) {
		for (let i = 0; i < results.length; i += BATCH_SIZE) {
			const batch = results.slice(i, i + BATCH_SIZE);
			await Promise.all(
				batch.map((result) =>
					uploadWithRetry(result).catch(() => {
						// Already handled inside uploadWithRetry
					}),
				),
			);
		}
	}

	async function handleUpload() {
		// Close dialog immediately - all work happens in background
		open = false;
		loading = false;

		// Store files locally before clearing the form
		const regularFiles = Array.from($files);
		const folderFilesSnapshot = [...folderFiles];

		// Clear the form immediately
		files.set([]);
		folderFiles = [];
		uploadErrors = [];

		$preparingUpload = {
			active: true,
			status:
				folderFilesSnapshot.length > 0 ? "Creating folders" : "Initializing",
		};

		// First, create all necessary folders and get UUID mapping
		const folderPathToUuid = await createFoldersForUpload(folderFilesSnapshot);

		$preparingUpload = { active: true, status: "Metadata" };

		const results: FullResult[] = [];
		try {
			const metadata = await createUploadMetadata(
				groupFilesByFolder(regularFiles, folderFilesSnapshot, folderPathToUuid),
				BATCH_SIZE,
			);

			for (const { result, displayName } of metadata) {
				results.push(result);
				const fileKey = fileNameWithoutFolder(result.data.finalName);
				$uploadingItems[fileKey] = 1;
				// Store the original filename for display
				$uploadingItemsNames[fileKey] = displayName;
			}
		} catch (e) {
			$preparingUpload = { active: false, status: "" };
			toast.error(m.toast_prepare_upload_error());
			throw e;
		}

		// Clear preparing state and start actual uploads
		$preparingUpload = { active: false, status: "" };

		// Initialize upload stats
		fileBytesUploaded.clear();
		$uploadStats = {
			totalFiles: results.length,
			completedFiles: 0,
			totalBytes: results.reduce((sum, r) => sum + r.file.size, 0),
			uploadedBytes: 0,
			startTime: Date.now(),
			speed: 0,
			eta: 0,
		};

		// Continue uploads in background
		await resultCallback(results)
			.finally(() => {
				// Final stats update
				$uploadStats = {
					...$uploadStats,
					completedFiles: $uploadStats.totalFiles,
					uploadedBytes: $uploadStats.totalBytes,
					speed: 0,
					eta: 0,
				};
			})
			.then(() => invalidate("app:files"));
	}
</script>

{#snippet uploadButton()}
    <Button
        type="button"
        {loading}
        disabled={totalFileCount === 0}
        onclick={() => handleUpload()}
    >
        Upload
        {#if totalFileCount === 1}
            1 file
        {:else if totalFileCount > 1}
            {totalFileCount} files
        {/if}
    </Button>
{/snippet}

<ResponsiveDialog
    bind:open
    bind:loading
    size="lg"
    title={m.upload_title()}
    description={m.upload_description()}
    form={{ method: "POST", enctype: "multipart/form-data" }}
    footer={uploadButton}
>
    <input type="hidden" name="rootFolder" value={page.params.path} />
    <FileDropZone
        {onUpload}
        {onFileRejected}
        {onFolderUpload}
        fileCount={totalFileCount}
        class="mb-5"
    />
    <input name="attachments" type="file" bind:files={$files} class="hidden" />
    <div class="mb-5 flex flex-col gap-3">
        {#each Array.from($files) as file, i (file.name)}
            <div>
                <div
                    class={cn(
                        "flex place-items-center justify-between gap-3 rounded-xl border p-3",
                    )}
                >
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                            <span class="text-sm">{file.name}</span>
                        </div>
                        <span class="text-muted-foreground text-xs"
                            >{displaySize(file.size)}</span
                        >
                    </div>
                    <div class="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onclick={() => {
                                removeFile(i);
                            }}
                        >
                            <XIcon />
                        </Button>
                    </div>
                </div>
            </div>
        {/each}
        {#each folderFiles as file, i (`folder-${file.relativePath}`)}
            <div>
                <div
                    class={cn(
                        "flex place-items-center justify-between gap-3 rounded-xl border p-3",
                    )}
                >
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                            <FolderIcon class="text-muted-foreground size-4" />
                            <span class="text-sm">{file.relativePath}</span>
                        </div>
                        <span class="text-muted-foreground text-xs"
                            >{displaySize(file.size)}</span
                        >
                    </div>
                    <div class="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onclick={() => {
                                removeFolderFile(i);
                            }}
                        >
                            <XIcon />
                        </Button>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</ResponsiveDialog>
