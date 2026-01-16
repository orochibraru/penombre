<script lang="ts">
    import { FolderIcon, XIcon } from "@lucide/svelte";
    import { toast } from "svelte-sonner";
    import { filesProxy, superForm } from "sveltekit-superforms";
    import { valibotClient } from "sveltekit-superforms/adapters";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/state";
    import {
        getApiClient,
        type UploadResult,
        type ObjectItem,
    } from "$lib/api-client";
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
        pendingUploadFiles,
    } from "$lib/store/upload";
    import { cn } from "$lib/utils";
    import { onMount } from "svelte";

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

    const concurrency = 3;

    onMount(() => {
        // Reset the upload stores when the component is mounted
        uploadingItems.set({});
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
                    console.debug(`Skipping OS file: ${fileName}`);
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
            toast.info(
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

    const apiClient = getApiClient(fetch);

    async function cleanup(fileName: string) {
        // Delete the file
        const res = await apiClient.storage.objects.item[":item"].$delete({
            param: {
                item: encodeURIComponent(fileNameWithoutFolder(fileName)),
            },
        });

        if (!res.ok) {
            console.error(
                `Failed to delete file after upload failure: ${fileNameWithoutFolder(
                    fileName,
                )}`,
                await res.text(),
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

    async function resultCallback(results: FullResult[]) {
        const uploadPromises: Promise<void>[] = [];

        for (const result of results) {
            try {
                const promise = new Promise<boolean>(async (resolve, fail) => {
                    const xhr = new XMLHttpRequest();
                    // result.data.finalName now includes the full path from the API
                    const finalUrl = `/api/storage/objects/item/${encodeURIComponent(result.data.finalName)}`;
                    xhr.open("POST", finalUrl);

                    // Also set credentials to include cookies
                    xhr.withCredentials = true;

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            // If failed, remove from uploading items
                            if (
                                uploadErrors.some(
                                    (e) =>
                                        e.data.finalName ===
                                        result.data.finalName,
                                )
                            ) {
                                delete $uploadingItems[
                                    fileNameWithoutFolder(result.data.finalName)
                                ];
                                return;
                            }
                            const percentLoaded =
                                (event.loaded / event.total) * 100;
                            $uploadingItems[
                                fileNameWithoutFolder(result.data.finalName)
                            ] = percentLoaded;
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            return resolve(true);
                        }

                        console.error(
                            `Upload failed for ${result.data.finalName}. Status: ${xhr.status}, Response: ${xhr.responseText}`,
                        );

                        uploadErrors.push({
                            error: xhr.responseText || "Upload failed.",
                            ...result,
                        });

                        return fail(`Upload failed with status ${xhr.status}.`);
                    };

                    xhr.onerror = () => {
                        console.error(
                            `Network error during upload for ${result.data.finalName}`,
                        );

                        uploadErrors.push({
                            error: xhr.responseText || "Network error",
                            ...result,
                        });

                        return fail("Network error occurred during upload.");
                    };

                    xhr.onabort = () => {
                        uploadErrors.push({
                            error: xhr.responseText || "Request aborted",
                            ...result,
                        });
                        console.error(
                            `Upload aborted for ${result.data.finalName}`,
                        );
                        return fail("Upload aborted.");
                    };

                    // Create FormData and append the file
                    const formData = new FormData();
                    formData.append("file", result.file);

                    xhr.send(formData);

                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        resolve(true);
                    }
                })
                    .then(async (res) => {
                        if (res === false) {
                            await cleanup(result.data.finalName);
                            return;
                        }

                        // result.data.finalName is now the full path from API
                        const fileRes = await apiClient.storage.objects.item[
                            ":item"
                        ].$get({
                            param: {
                                item: encodeURIComponent(result.data.finalName),
                            },
                            query: {},
                        });

                        if (fileRes.ok) {
                            const file = (await fileRes.json()) as ObjectItem;
                            file.key = fileNameWithoutFolder(file.key);
                            $uploadedItems[
                                fileNameWithoutFolder(result.data.finalName)
                            ] = file;

                            // Remove from uploadingItems now that upload is complete
                            const tmp = $uploadingItems;
                            delete tmp[
                                fileNameWithoutFolder(result.data.finalName)
                            ];
                            $uploadingItems = { ...tmp };

                            removeFileByRef(result.file);
                        }
                    })
                    .catch(async () => {
                        await cleanup(result.data.finalName);
                        return;
                    });
                uploadPromises.push(promise);
            } catch (e) {
                toast.error(
                    `Upload failed for ${fileNameWithoutFolder(result.data.finalName)}.`,
                );
                delete $uploadingItems[
                    fileNameWithoutFolder(result.data.finalName)
                ];
            }
        }

        while (uploadPromises.length) {
            await Promise.all(uploadPromises.splice(0, concurrency));
        }
    }

    /**
     * Extracts unique folder paths from folder files and creates them.
     */
    async function createFoldersForUpload(): Promise<Set<string>> {
        const createdFolders = new Set<string>();

        // Extract unique folder paths from folder files
        const folderPaths = new Set<string>();
        for (const file of folderFiles) {
            if (file.relativePath) {
                const parts = file.relativePath.split("/");
                // Build each parent path (exclude the filename)
                for (let i = 1; i < parts.length; i++) {
                    const folderPath = parts.slice(0, i).join("/");
                    folderPaths.add(folderPath);
                }
            }
        }

        // Sort by depth (create parent folders first)
        const sortedPaths = Array.from(folderPaths).sort(
            (a, b) => a.split("/").length - b.split("/").length,
        );

        // Fetch the full folder tree once to check for existing folders
        let existingFolderPaths: Set<string> | null = null;
        try {
            const res = await apiClient.storage.folders.tree.$get();
            if (res.ok) {
                const folders = await res.json();
                existingFolderPaths = new Set(
                    folders.map((f) => f.path.toLowerCase()),
                );
            }
        } catch (e) {
            console.warn("Failed to fetch folder tree:", e);
        }

        // Create each folder
        for (const folderPath of sortedPaths) {
            const parts = folderPath.split("/");
            const folderName = parts[parts.length - 1] ?? "";
            const parentParts = parts.slice(0, -1);

            // Build the full parent path including current page path
            let parent = page.params.path || "";
            if (parentParts.length > 0) {
                parent = parent
                    ? `${parent}/${parentParts.join("/")}`
                    : parentParts.join("/");
            }

            // Build the full path for this folder
            const fullPath = parent ? `${parent}/${folderName}` : folderName;

            // Check if this folder already exists
            if (existingFolderPaths?.has(fullPath.toLowerCase())) {
                console.debug(`Folder already exists: ${fullPath}`);
                createdFolders.add(folderPath);
                continue;
            }

            try {
                const res = await apiClient.storage.folders.$post({
                    json: {
                        name: folderName,
                        parent: parent || undefined,
                    },
                });

                if (res.ok) {
                    createdFolders.add(folderPath);
                    // Add to our local cache so we don't try to create it again
                    existingFolderPaths?.add(fullPath.toLowerCase());
                } else {
                    const errorText = await res.text();
                    console.warn(
                        `Failed to create folder ${folderPath}:`,
                        errorText,
                    );
                }
            } catch (e) {
                console.warn(`Error creating folder ${folderPath}:`, e);
            }
        }

        return createdFolders;
    }

    async function handleUpload() {
        loading = true;
        const results: FullResult[] = [];

        const uploadMetadataPromises = [];

        // Handle regular files
        for (const file of $files) {
            const fullPath = page.params.path
                ? `${page.params.path}/${file.name}`
                : file.name;
            const promise = apiClient.storage.objects
                .$post({
                    query: { folder: page.params.path },
                    json: {
                        name: fullPath,
                        size: file.size,
                    },
                })
                .then(async (res) => {
                    if (!res.ok) {
                        throw new Error(
                            "No data returned from upload endpoint",
                        );
                    }

                    const data = await res.json();
                    const result: FullResult = {
                        data,
                        file,
                    };

                    results.push(result);
                    $uploadingItems[
                        fileNameWithoutFolder(result.data.finalName)
                    ] = 1;

                    return res;
                })
                .catch((e) => {
                    console.error(e);
                    toast.error("Failed to schedule files for upload.");
                    loading = false;
                    throw e;
                });

            uploadMetadataPromises.push(promise);
        }

        // Handle folder files (files with relative paths)
        for (const file of folderFiles) {
            const relativePath = file.relativePath || file.name;

            // Extract filename and folder path from relativePath
            const pathParts = relativePath.split("/");
            const fileName = pathParts[pathParts.length - 1] ?? file.name;
            const folderPath =
                pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : "";

            // Build the full folder path including current directory
            const fullFolderPath = page.params.path
                ? folderPath
                    ? `${page.params.path}/${folderPath}`
                    : page.params.path
                : folderPath || undefined;

            const promise = apiClient.storage.objects
                .$post({
                    query: { folder: fullFolderPath },
                    json: {
                        name: fileName,
                        size: file.size,
                    },
                })
                .then(async (res) => {
                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error(
                            "Upload metadata creation failed:",
                            errorText,
                        );
                        throw new Error(
                            `Failed to create metadata: ${errorText}`,
                        );
                    }

                    const data = await res.json();
                    const result: FullResult = {
                        data,
                        file,
                    };

                    results.push(result);
                    $uploadingItems[
                        fileNameWithoutFolder(result.data.finalName)
                    ] = 1;

                    return res;
                })
                .catch((e) => {
                    console.error(`Error scheduling ${relativePath}:`, e);
                    toast.error(
                        `Failed to schedule ${relativePath} for upload.`,
                    );
                    throw e;
                });

            uploadMetadataPromises.push(promise);
        }

        const globalpromise = Promise.all(uploadMetadataPromises).finally(
            async () => {
                open = false;
                await invalidate("app:files");
                files.set([]);
                folderFiles = [];

                void resultCallback(results).finally(() => {
                    loading = false;

                    if (uploadErrors.length > 0) {
                        console.error(
                            uploadErrors.map((e) => e.error).join("\n"),
                        );
                        toast.error("Failed to upload some items");
                    } else {
                        toast.success("Successfully uploaded all items");
                    }
                });
            },
        );

        toast.promise(globalpromise, {
            loading: "Queuing files for upload",
            success: "Files queued for upload",
            error: "Failed to queue files for upload",
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
