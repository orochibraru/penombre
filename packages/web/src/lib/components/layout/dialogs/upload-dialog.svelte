<script lang="ts">
    import { XIcon } from "@lucide/svelte";
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

    const onUpload: FileDropZoneProps["onUpload"] = async (uploadedFiles) => {
        // we use set instead of an assignment since it accepts a File[]
        files.set([...Array.from($files), ...uploadedFiles]);
    };

    function removeFile(index: number) {
        // we use set instead of an assignment since it accepts a File[]
        files.set([
            ...Array.from($files).slice(0, index),
            ...Array.from($files).slice(index + 1),
        ]);
    }

    function removeFileByRef(fileToRemove: File) {
        files.set(Array.from($files).filter((f) => f !== fileToRemove));
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

    async function handleUpload() {
        loading = true;
        const results: FullResult[] = [];

        const uploadMetadataPromises = [];
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

        const globalpromise = Promise.all(uploadMetadataPromises).finally(
            async () => {
                open = false;
                await invalidate("app:files");
                files.set([]);

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
        disabled={$files.length === 0}
        onclick={() => handleUpload()}
    >
        Upload
        {#if $files.length > 0 && $files.length === 1}
            {$files.length} file
        {:else if $files.length > 1}
            {$files.length} files
        {/if}
    </Button>
{/snippet}

<ResponsiveDialog
    bind:open
    bind:loading
    size="lg"
    title="Upload new files"
    description="Drag n' Drop or click to select the files you want to upload."
    form={{ method: "POST", enctype: "multipart/form-data" }}
    footer={uploadButton}
>
    <input type="hidden" name="rootFolder" value={page.params.path} />
    <FileDropZone
        {onUpload}
        {onFileRejected}
        fileCount={$files.length}
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
    </div>
</ResponsiveDialog>
