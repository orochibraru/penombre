<script lang="ts">
	import { FilesIcon, FolderIcon, XIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { filesProxy, superForm } from "sveltekit-superforms";
	import { zod4Client } from "sveltekit-superforms/adapters";
	import { page } from "$app/state";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		displaySize,
		FileDropZone,
		type FileDropZoneProps,
	} from "$lib/components/ui/file-drop-zone";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
	import * as m from "$lib/paraglide/messages.js";
	import { uploadSchema } from "$lib/schemas/upload";
	import {
		pendingUploadFiles,
		preparingUpload,
		uploadedItems,
		uploadingItems,
		uploadingItemsNames,
	} from "$lib/store/upload";
	import { enqueueUploads } from "$lib/upload/manager";
	import type { UploadJob } from "$lib/upload/queue";
	import { cn, randomId } from "$lib/utils";
	import {
		createFoldersForUpload,
		createUploadMetadata,
		type FileWithPath,
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

	/**
	 * Where a dropped folder's contents end up. "keep" recreates the folder
	 * itself here; "flatten" empties it into the folder being browsed — which
	 * is what this always did, silently.
	 */
	let folderPlacement = $state<"keep" | "flatten">("keep");

	/** The name of the folder that was picked, for the placement labels. */
	const droppedFolderName = $derived(
		folderFiles[0]?.relativePath?.split("/")[0] ?? "",
	);

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
			.filter((file) => !shouldSkipFile(file.name))
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

	const onFileRejected: FileDropZoneProps["onFileRejected"] = ({
		reason,
		file,
	}) => {
		toast.error(m.toast_file_upload_failed({ name: file.name }), {
			description: reason,
		});
	};

	/** The key the file list and the progress panel use for a row. */
	function rowKeyFor(finalName: string): string {
		return page.params.path
			? finalName.replace(`${page.params.path}/`, "")
			: finalName;
	}

	async function handleUpload() {
		// Close dialog immediately - all work happens in the worker.
		open = false;
		loading = false;

		const regularFiles = Array.from($files);
		const folderFilesSnapshot = [...folderFiles];
		const keepRoot = folderPlacement === "keep";

		files.set([]);
		folderFiles = [];

		$preparingUpload = {
			active: true,
			status:
				folderFilesSnapshot.length > 0 ? "Creating folders" : "Initializing",
		};

		// Folders first: a file's metadata row needs the folder it belongs to.
		const folderPathToUuid = await createFoldersForUpload(
			folderFilesSnapshot,
			keepRoot,
		);

		$preparingUpload = { active: true, status: "Metadata" };

		let jobs: UploadJob[];
		try {
			const metadata = await createUploadMetadata(
				groupFilesByFolder(
					regularFiles,
					folderFilesSnapshot,
					folderPathToUuid,
					keepRoot,
				),
				BATCH_SIZE,
			);

			jobs = metadata.map(({ result, displayName }) => ({
				id: randomId(),
				fileId: result.data.metadata.id,
				finalName: result.data.finalName,
				rowKey: rowKeyFor(result.data.finalName),
				displayName,
				size: result.file.size,
				file: result.file,
				status: "pending" as const,
				createdAt: Date.now(),
			}));
		} catch (e) {
			$preparingUpload = { active: false, status: "" };
			toast.error(m.toast_prepare_upload_error());
			throw e;
		}

		$preparingUpload = { active: false, status: "" };

		// From here on the worker owns it: the dialog is already closed, and a
		// reload picks the queue back up from IndexedDB.
		await enqueueUploads(jobs);
	}
</script>

{#snippet uploadButton()}
    <Button
        type="button"
        {loading}
        disabled={totalFileCount === 0}
        onclick={() => handleUpload()}
    >
        {m.upload_action({ count: String(totalFileCount) })}
    </Button>
{/snippet}

{#snippet entry(name: string, size: number, remove: () => void, folder: boolean)}
    <div
        class="flex place-items-center justify-between gap-3 rounded-xl border p-3"
    >
        <div class="flex min-w-0 flex-col">
            <div class="flex min-w-0 items-center gap-2">
                {#if folder}
                    <FolderIcon class="text-muted-foreground size-4 shrink-0" />
                {/if}
                <span class="truncate text-sm">{name}</span>
            </div>
            <span class="text-muted-foreground text-xs">
                {displaySize(size)}
            </span>
        </div>
        <Button variant="outline" size="icon" onclick={remove}>
            <XIcon />
        </Button>
    </div>
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

    <!-- Two zones, not one with a link tucked into it: picking files and
         picking a folder do different things to the resulting tree, so they
         are offered as two different choices. -->
    <div class="mb-5 grid gap-4 md:grid-cols-2">
        <section class="flex flex-col gap-2">
            <h3 class="flex items-center gap-2 text-sm font-medium">
                <FilesIcon class="text-primary size-4" />
                {m.upload_files_heading()}
            </h3>
            <FileDropZone
                {onUpload}
                {onFileRejected}
                fileCount={totalFileCount}
                class="h-40"
            />
            <p class="text-muted-foreground text-xs">
                {m.upload_files_hint()}
            </p>
        </section>

        <section class="flex flex-col gap-2">
            <h3 class="flex items-center gap-2 text-sm font-medium">
                <FolderIcon class="text-primary size-4" />
                {m.upload_folder_heading()}
            </h3>
            <FileDropZone
                onUpload={onFolderUpload}
                {onFolderUpload}
                {onFileRejected}
                folderOnly
                fileCount={totalFileCount}
                class="h-40"
            />
            <p class="text-muted-foreground text-xs">
                {m.upload_folder_hint()}
            </p>
        </section>
    </div>

    {#if folderFiles.length > 0}
        <div class="mb-5 rounded-xl border p-3">
            <p class="mb-2 text-sm font-medium">
                {m.upload_folder_placement_title()}
            </p>
            <RadioGroup.Root bind:value={folderPlacement} class="gap-2">
                <div class="flex items-center gap-2">
                    <RadioGroup.Item value="keep" id="folder-placement-keep" />
                    <Label for="folder-placement-keep" class="text-sm font-normal">
                        {m.upload_folder_placement_keep({
                            name: droppedFolderName,
                        })}
                    </Label>
                </div>
                <div class="flex items-center gap-2">
                    <RadioGroup.Item
                        value="flatten"
                        id="folder-placement-flatten"
                    />
                    <Label
                        for="folder-placement-flatten"
                        class="text-sm font-normal"
                    >
                        {m.upload_folder_placement_flatten()}
                    </Label>
                </div>
            </RadioGroup.Root>
        </div>
    {/if}

    <input name="attachments" type="file" bind:files={$files} class="hidden" />

    <div class={cn("flex flex-col gap-3", totalFileCount > 0 && "mb-5")}>
        {#each Array.from($files) as file, i (file.name)}
            {@render entry(file.name, file.size, () => removeFile(i), false)}
        {/each}
        {#each folderFiles as file, i (`folder-${file.relativePath}`)}
            {@render entry(
                file.relativePath ?? file.name,
                file.size,
                () => removeFolderFile(i),
                true,
            )}
        {/each}
    </div>
</ResponsiveDialog>
