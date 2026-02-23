<script lang="ts">
    import { FolderIcon, XIcon } from "@lucide/svelte";
    import { toast } from "svelte-sonner";
    import { filesProxy, superForm } from "sveltekit-superforms";
    import { valibotClient } from "sveltekit-superforms/adapters";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import { api, type UploadResult, type ObjectItem } from "$lib/api";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import { Button } from "$lib/components/ui/button";
    import {
        displaySize,
        FileDropZone,
        type FileDropZoneProps,
    } from "$lib/components/ui/file-drop-zone";
    import { uploadSchema } from "$lib/schemas/upload";
    import {
        uploadedItems,
        uploadingItems,
        uploadingItemsNames,
        pendingUploadFiles,
        preparingUpload,
        uploadStats,
    } from "$lib/store/upload";
    import { cn } from "$lib/utils";
    import { onMount } from "svelte";
    import { resolve } from "$app/paths";

    type Props = {
        open: boolean;
        loading: boolean;
    };

    type FileWithPath = File & { relativePath?: string };

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
        if (elapsed <= 0) return;

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

    let { open = $bindable(false), loading = $bindable(false) }: Props =
        $props();

    // Pick up pending files from drag/drop when dialog opens
    $effect(() => {
        if (open && $pendingUploadFiles.length > 0) {
            files.set([...Array.from($files), ...$pendingUploadFiles]);
            pendingUploadFiles.set([]);
        }
    });

    const superform = superForm(page.data.uploadForm, {
        validators: valibotClient(uploadSchema),
    });

    const files = filesProxy(superform, "attachments");

    // Track files from folder uploads with their relative paths
    let folderFiles = $state<FileWithPath[]>([]);

    const onUpload: FileDropZoneProps["onUpload"] = async (uploadedFiles) => {
        // we use set instead of an assignment since it accepts a File[]
        files.set([...Array.from($files), ...uploadedFiles]);
    };

    const onFolderUpload: FileDropZoneProps["onFolderUpload"] = async (
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

        if (filesWithPaths.length < uploadedFiles.length) {
            const skippedCount = uploadedFiles.length - filesWithPaths.length;
            console.info(
                `Skipped ${skippedCount} system ${skippedCount === 1 ? "file" : "files"}`,
            );
        }

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

    const onFileRejected: FileDropZoneProps["onFileRejected"] = async ({
        reason,
        file,
    }) => {
        toast.error(`${file.name} failed to upload.`, { description: reason });
    };

    type FullResult = {
        data: UploadResult;
        file: File;
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

        if (deleteError) {
            console.error(
                `Failed to delete file after upload failure: ${fileNameWithoutFolder(
                    fileName,
                )}`,
                deleteError,
            );
        }

        const tmp = $uploadingItems;

        // The below doesn't work since Svelte doesn't track changes to nested objects in stores
        delete tmp[fileNameWithoutFolder(fileName)];

        // So we do this instead
        $uploadingItems = { ...tmp };

        const tmp2 = $uploadedItems;
        delete tmp2[fileNameWithoutFolder(fileName)];
        $uploadedItems = { ...tmp2 };

        await invalidate("app:files");

        removeFileByRef(
            uploadErrors.find((e) => e.data.finalName === fileName)?.file!,
        );
    }

    /**
     * Uploads a single file via XHR with retry logic.
     * Returns true on success, throws on permanent failure.
     */
    function uploadSingleFile(
        result: FullResult,
        attempt = 1,
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
                        uploadErrors.some(
                            (e) => e.data.finalName === result.data.finalName,
                        )
                    ) {
                        delete $uploadingItems[
                            fileNameWithoutFolder(result.data.finalName)
                        ];
                        return;
                    }
                    const percentLoaded = (event.loaded / event.total) * 100;
                    $uploadingItems[
                        fileNameWithoutFolder(result.data.finalName)
                    ] = percentLoaded;

                    // Track bytes for speed/ETA
                    fileBytesUploaded.set(result.data.finalName, event.loaded);
                    updateUploadSpeed();
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    return finish(true);
                }
                console.error(
                    `Upload failed for ${result.data.finalName}. Status: ${xhr.status}, Response: ${xhr.responseText} (attempt ${attempt}/${MAX_RETRIES})`,
                );
                return fail({
                    status: xhr.status,
                    response: xhr.responseText || "Upload failed.",
                });
            };

            xhr.onerror = () => {
                console.error(
                    `Network error during upload for ${result.data.finalName} (attempt ${attempt}/${MAX_RETRIES})`,
                );
                return fail({
                    status: 0,
                    response: xhr.responseText || "Network error",
                });
            };

            xhr.onabort = () => {
                console.error(
                    `Upload aborted for ${result.data.finalName} (attempt ${attempt}/${MAX_RETRIES})`,
                );
                return fail({
                    status: 0,
                    response: xhr.responseText || "Request aborted",
                });
            };

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
                    $uploadingItems[
                        fileNameWithoutFolder(result.data.finalName)
                    ] = 0;
                }

                const success = await uploadSingleFile(result, attempt);

                if (success) {
                    // Mark file bytes as fully uploaded
                    fileBytesUploaded.set(
                        result.data.finalName,
                        result.file.size,
                    );

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
                                    id: encodeURIComponent(
                                        result.data.finalName,
                                    ),
                                },
                            },
                        },
                    );

                    if (fileData?.data) {
                        const file = fileData.data as unknown as ObjectItem;
                        file.key = fileNameWithoutFolder(file.key);
                        $uploadedItems[
                            fileNameWithoutFolder(result.data.finalName)
                        ] = file;

                        const tmp = $uploadingItems;
                        delete tmp[
                            fileNameWithoutFolder(result.data.finalName)
                        ];
                        $uploadingItems = { ...tmp };

                        removeFileByRef(result.file);
                    }
                    return;
                }
            } catch (e) {
                lastError = e as { status: number; response: string };

                if (attempt < MAX_RETRIES) {
                    const delay =
                        RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    console.warn(
                        `Retrying upload for ${result.data.finalName} in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`,
                    );
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

    /**
     * Extracts unique folder paths from folder files and creates them.
     * Returns a map of display name paths to UUID paths.
     */
    async function createFoldersForUpload(
        folderFilesSnapshot: FileWithPath[],
    ): Promise<Map<string, string>> {
        const folderPathToUuid = new Map<string, string>();

        // Extract unique folder paths from folder files
        const folderPaths = new Set<string>();
        for (const file of folderFilesSnapshot) {
            if (file.relativePath) {
                const parts = file.relativePath.split("/");
                // Build each parent path (exclude the filename and the root folder)
                // Start from i=2 to skip the root folder itself (e.g., "MyFolder")
                // Only create nested folders within it (e.g., "MyFolder/subfolder")
                // The path we store starts from index 1 (skipping root folder name)
                for (let i = 2; i < parts.length; i++) {
                    // Store path starting from index 1 (first subfolder after root)
                    const folderPath = parts.slice(1, i).join("/");
                    folderPaths.add(folderPath);
                }
            }
        }

        // Sort by depth (create parent folders first)
        const sortedPaths = Array.from(folderPaths).sort(
            (a, b) => a.split("/").length - b.split("/").length,
        );

        // Group paths by depth so same-depth folders can be created in parallel
        const pathsByDepth = new Map<number, string[]>();
        for (const p of sortedPaths) {
            const depth = p.split("/").length;
            const group = pathsByDepth.get(depth);
            if (group) {
                group.push(p);
            } else {
                pathsByDepth.set(depth, [p]);
            }
        }

        // Fetch the full folder tree once to check for existing folders
        let existingFolders: Map<string, string> | null = null;
        try {
            const { data: treeData } = await api.GET(
                "/api/v1/storage/folder/tree",
            );
            if (treeData?.data) {
                const folders = treeData.data;
                // Map display name path to UUID path
                existingFolders = new Map(
                    folders.map((f) => [f.path.toLowerCase(), f.id]),
                );
            }
        } catch (e) {
            console.warn("Failed to fetch folder tree:", e);
        }

        // Create folders level by level, parallelizing within each depth
        const sortedDepths = Array.from(pathsByDepth.keys()).sort(
            (a, b) => a - b,
        );

        for (const depth of sortedDepths) {
            const pathsAtDepth = pathsByDepth.get(depth) ?? [];

            await Promise.all(
                pathsAtDepth.map(async (folderPath) => {
                    const parts = folderPath.split("/");
                    const folderName = parts[parts.length - 1] ?? "";
                    const parentParts = parts.slice(0, -1);

                    // Build the parent display path (used for checking existing folders)
                    const parentDisplayPath =
                        parentParts.length > 0 ? parentParts.join("/") : "";

                    // Build parent UUID path by traversing the folder hierarchy
                    let parentUuidPath = page.params.path || "";
                    if (parentParts.length > 0) {
                        // Build path part by part, converting each to UUID
                        for (const part of parentParts) {
                            const currentDisplayPath = parentParts
                                .slice(0, parentParts.indexOf(part) + 1)
                                .join("/");
                            const uuid =
                                folderPathToUuid.get(currentDisplayPath);
                            if (uuid) {
                                parentUuidPath = parentUuidPath
                                    ? `${parentUuidPath}/${uuid}`
                                    : uuid;
                            }
                        }
                    }

                    // Build the full display path for this folder (used for checking existing folders)
                    const fullDisplayPath = page.params.path
                        ? parentDisplayPath
                            ? `${page.params.path}/${parentDisplayPath}/${folderName}`
                            : `${page.params.path}/${folderName}`
                        : parentDisplayPath
                          ? `${parentDisplayPath}/${folderName}`
                          : folderName;

                    // Check if this folder already exists
                    if (existingFolders?.has(fullDisplayPath.toLowerCase())) {
                        const existingUuid = existingFolders.get(
                            fullDisplayPath.toLowerCase(),
                        );
                        if (existingUuid) {
                            folderPathToUuid.set(folderPath, existingUuid);
                        }
                        return;
                    }

                    try {
                        const { data: folderData, error: folderError } =
                            await api.POST("/api/v1/storage/folder", {
                                body: {
                                    name: folderName,
                                    parent: parentUuidPath || undefined,
                                },
                            });

                        if (folderData?.data) {
                            const folderId = folderData.data.id;
                            folderPathToUuid.set(folderPath, folderId);
                            // Add to our local cache so we don't try to create it again
                            existingFolders?.set(
                                fullDisplayPath.toLowerCase(),
                                folderId,
                            );
                        } else if (folderError) {
                            console.warn(
                                `Failed to create folder ${folderPath}:`,
                                folderError,
                            );
                        }
                    } catch (e) {
                        console.warn(`Error creating folder ${folderPath}:`, e);
                    }
                }),
            );
        }

        return folderPathToUuid;
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

        // Do all the work in the background
        const results: FullResult[] = [];

        // Show preparing state in the progress indicator
        if (folderFilesSnapshot.length > 0) {
            $preparingUpload = { active: true, status: "Creating folders" };
        } else {
            $preparingUpload = { active: true, status: "Initializing" };
        }

        // First, create all necessary folders and get UUID mapping
        const folderPathToUuid =
            await createFoldersForUpload(folderFilesSnapshot);

        $preparingUpload = { active: true, status: "Metadata" };

        // Group files by folder for batch creation (using UUID paths)
        interface FilesByFolder {
            [folder: string]: Array<{ file: File; name: string }>;
        }
        const filesByFolder: FilesByFolder = {};

        // Process regular files
        for (const file of regularFiles) {
            const folderUuidPath = page.params.path || "";

            if (!filesByFolder[folderUuidPath]) {
                filesByFolder[folderUuidPath] = [];
            }

            const folderArray = filesByFolder[folderUuidPath];
            if (folderArray) {
                folderArray.push({
                    file,
                    name: file.name,
                });
            }
        }

        // Process folder files (with relative paths)
        for (const file of folderFilesSnapshot) {
            const relativePath = file.relativePath || file.name;
            const pathParts = relativePath.split("/");
            const fileName = pathParts[pathParts.length - 1] ?? file.name;
            // Get folder path: skip root folder (index 0) and filename (last item)
            const displayFolderPath =
                pathParts.length > 2 ? pathParts.slice(1, -1).join("/") : "";

            // Convert display folder path to UUID path by building incrementally
            let folderUuidPath = page.params.path || "";
            if (displayFolderPath) {
                const folderParts = displayFolderPath.split("/");
                for (let i = 0; i < folderParts.length; i++) {
                    const partialPath = folderParts.slice(0, i + 1).join("/");
                    const uuid = folderPathToUuid.get(partialPath);
                    if (uuid) {
                        folderUuidPath = folderUuidPath
                            ? `${folderUuidPath}/${uuid}`
                            : uuid;
                    }
                }
            }

            if (!filesByFolder[folderUuidPath]) {
                filesByFolder[folderUuidPath] = [];
            }

            const folderArray = filesByFolder[folderUuidPath];
            if (folderArray) {
                folderArray.push({
                    file,
                    name: fileName,
                });
            }
        }

        // Send batch metadata requests in chunks of BATCH_SIZE per folder, parallelized across folders
        try {
            const batchPromises = Object.entries(filesByFolder).map(
                async ([folder, filesInFolder]) => {
                    const folderResults: {
                        result: FullResult;
                        displayName: string;
                    }[] = [];

                    // Chunk files within this folder into batches of BATCH_SIZE
                    for (let i = 0; i < filesInFolder.length; i += BATCH_SIZE) {
                        const chunk = filesInFolder.slice(i, i + BATCH_SIZE);
                        const batchPayload = chunk.map((item) => ({
                            name: item.name,
                            size: item.file.size,
                        }));

                        const { data: batchData, error: batchError } =
                            await api.POST("/api/v1/storage/file/batch", {
                                params: {
                                    query: { folder: folder || undefined },
                                },
                                body: {
                                    files: batchPayload,
                                },
                            });

                        if (batchError || !batchData?.data) {
                            console.error(
                                "Batch upload metadata creation failed:",
                                batchError,
                            );
                            throw new Error(
                                `Failed to create batch metadata: ${JSON.stringify(batchError)}`,
                            );
                        }

                        const batchResults =
                            batchData.data as unknown as UploadResult[];

                        for (let j = 0; j < chunk.length; j++) {
                            const uploadResult = batchResults[j];
                            const fileItem = chunk[j];

                            if (!uploadResult || !fileItem) {
                                console.error(
                                    `Missing upload result or file at index ${j}`,
                                );
                                continue;
                            }

                            folderResults.push({
                                result: {
                                    data: uploadResult,
                                    file: fileItem.file,
                                },
                                displayName: fileItem.name,
                            });
                        }
                    }

                    return folderResults;
                },
            );

            const allFolderResults = await Promise.all(batchPromises);

            for (const folderResults of allFolderResults) {
                for (const { result, displayName } of folderResults) {
                    results.push(result);
                    const fileKey = fileNameWithoutFolder(
                        result.data.finalName,
                    );
                    $uploadingItems[fileKey] = 1;
                    // Store the original filename for display
                    $uploadingItemsNames[fileKey] = displayName;
                }
            }
        } catch (e) {
            console.error(e);
            $preparingUpload = { active: false, status: "" };
            toast.error("Failed to prepare files for upload.");
            throw e;
        }

        // Clear preparing state and start actual uploads
        $preparingUpload = { active: false, status: "" };

        // Initialize upload stats
        const totalBytes = results.reduce((sum, r) => sum + r.file.size, 0);
        fileBytesUploaded.clear();
        $uploadStats = {
            totalFiles: results.length,
            completedFiles: 0,
            totalBytes,
            uploadedBytes: 0,
            startTime: Date.now(),
            speed: 0,
            eta: 0,
        };

        // Continue uploads in background
        resultCallback(results).finally(async () => {
            // Final stats update
            $uploadStats = {
                ...$uploadStats,
                completedFiles: $uploadStats.totalFiles,
                uploadedBytes: $uploadStats.totalBytes,
                speed: 0,
                eta: 0,
            };
            await invalidate("app:files");

            if (uploadErrors.length > 0) {
                console.error(uploadErrors.map((e) => e.error).join("\n"));
            }
        });
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
    title="Upload new files"
    description="Drag n' Drop or click to select the files you want to upload. You can also select entire folders."
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
