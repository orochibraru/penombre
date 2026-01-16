<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
    import { FolderUpIcon, UploadIcon } from "@lucide/svelte";
    import { useId } from "bits-ui";
    import { cn } from "$lib/utils";
    import { displaySize } from ".";
    import type { FileDropZoneProps, FileRejectedReason } from "./types";
    import { MediaQuery } from "svelte/reactivity";

    let {
        id = useId(),
        children,
        maxFiles,
        maxFileSize,
        fileCount,
        disabled = false,
        onUpload,
        onFileRejected,
        onFolderUpload,
        accept,
        class: className,
        ...rest
    }: FileDropZoneProps = $props();

    const folderId = $derived(`${id}-folder`);

    $effect(() => {
        if (maxFiles !== undefined && fileCount === undefined) {
            console.warn(
                "Make sure to provide FileDropZone with `fileCount` when using the `maxFiles` prompt",
            );
        }
    });

    let uploading = $state(false);

    const drop = async (
        e: DragEvent & {
            currentTarget: EventTarget & HTMLLabelElement;
        },
    ) => {
        if (disabled || !canUploadFiles) return;

        e.preventDefault();

        const items = e.dataTransfer?.items;
        if (items) {
            // Check if any items are directories
            const hasDirectories = Array.from(items).some(
                (item) =>
                    item.webkitGetAsEntry &&
                    item.webkitGetAsEntry()?.isDirectory,
            );

            if (hasDirectories && onFolderUpload) {
                // Handle folder drop - collect all files recursively
                const allFiles: File[] = [];
                for (const item of Array.from(items)) {
                    const entry = item.webkitGetAsEntry?.();
                    if (entry) {
                        const files = await collectFilesFromEntry(entry);
                        allFiles.push(...files);
                    }
                }
                await onFolderUpload(allFiles);
                return;
            }
        }

        const droppedFiles = Array.from(e.dataTransfer?.files ?? []);
        await upload(droppedFiles);
    };

    /**
     * Recursively collects files from a FileSystemEntry (for folder drag & drop)
     */
    async function collectFilesFromEntry(
        entry: FileSystemEntry,
    ): Promise<File[]> {
        if (entry.isFile) {
            return new Promise((resolve) => {
                (entry as FileSystemFileEntry).file((file) => {
                    // Preserve the relative path
                    Object.defineProperty(file, "webkitRelativePath", {
                        value: entry.fullPath.slice(1), // Remove leading slash
                        writable: false,
                    });
                    resolve([file]);
                });
            });
        }

        if (entry.isDirectory) {
            const dirReader = (
                entry as FileSystemDirectoryEntry
            ).createReader();
            const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                dirReader.readEntries((entries) => resolve(entries));
            });

            const files: File[] = [];
            for (const childEntry of entries) {
                const childFiles = await collectFilesFromEntry(childEntry);
                files.push(...childFiles);
            }
            return files;
        }

        return [];
    }

    const change = async (
        e: Event & {
            currentTarget: EventTarget & HTMLInputElement;
        },
    ) => {
        if (disabled) return;

        const selectedFiles = e.currentTarget.files;

        if (!selectedFiles) return;

        await upload(Array.from(selectedFiles));

        // this if a file fails and we upload the same file again we still get feedback
        (e.target as HTMLInputElement).value = "";
    };

    const folderChange = async (
        e: Event & {
            currentTarget: EventTarget & HTMLInputElement;
        },
    ) => {
        if (disabled || !onFolderUpload) return;

        const selectedFiles = e.currentTarget.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        // Files from webkitdirectory have webkitRelativePath set
        await onFolderUpload(Array.from(selectedFiles));

        // Reset input
        (e.target as HTMLInputElement).value = "";
    };

    const shouldAcceptFile = (
        file: File,
        fileNumber: number,
    ): FileRejectedReason | undefined => {
        if (maxFileSize !== undefined && file.size > maxFileSize)
            return "Maximum file size exceeded";

        if (maxFiles !== undefined && fileNumber > maxFiles)
            return "Maximum files uploaded";

        if (!accept) return undefined;

        const acceptedTypes = accept
            .split(",")
            .map((a) => a.trim().toLowerCase());
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();

        const isAcceptable = acceptedTypes.some((pattern) => {
            // check extension like .mp4
            if (fileType.startsWith(".")) {
                return fileName.endsWith(pattern);
            }

            // if pattern has wild card like video/*
            if (pattern.endsWith("/*")) {
                const baseType = pattern.slice(0, pattern.indexOf("/*"));
                return fileType.startsWith(`${baseType}/`);
            }

            // otherwise it must be a specific type like video/mp4
            return fileType === pattern;
        });

        if (!isAcceptable) return "File type not allowed";

        return undefined;
    };

    const upload = async (uploadFiles: File[]) => {
        uploading = true;

        const validFiles: File[] = [];

        if (uploadFiles && uploadFiles.length > 0) {
            for (let i = 0; i < uploadFiles.length; i++) {
                const file = uploadFiles[i];

                const rejectedReason = shouldAcceptFile(
                    file as File,
                    (fileCount ?? 0) + i + 1,
                );

                if (rejectedReason) {
                    onFileRejected?.({
                        file: file as File,
                        reason: rejectedReason,
                    });
                    continue;
                }

                validFiles.push(file as File);
            }
        }

        await onUpload(validFiles);

        uploading = false;
    };

    const canUploadFiles = $derived(
        !disabled &&
            !uploading &&
            !(
                maxFiles !== undefined &&
                fileCount !== undefined &&
                fileCount >= maxFiles
            ),
    );
    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

<label
    ondragover={(e) => e.preventDefault()}
    ondrop={drop}
    for={id}
    aria-disabled={!canUploadFiles}
    class={cn(
        "border-border hover:bg-accent/25 flex h-48 w-full place-items-center justify-center rounded-lg border-2 border-dashed md:p-6 transition-all hover:cursor-pointer aria-disabled:opacity-50 aria-disabled:hover:cursor-not-allowed",
        className,
    )}
>
    {#if children}
        {@render children()}
    {:else}
        <div class="flex flex-col place-items-center justify-center gap-2">
            <div
                class="border-border text-muted-foreground flex size-14 place-items-center justify-center rounded-full border border-dashed"
            >
                <UploadIcon class="size-7" />
            </div>
            <div class="flex flex-col gap-0.5 text-center">
                <span class="text-muted-foreground font-medium">
                    {#if isDesktop.current}
                        Drag 'n' drop files here, or click to select files
                    {:else}
                        Tap to select files
                    {/if}
                </span>
                {#if maxFiles || maxFileSize}
                    <span class="text-muted-foreground/75 text-sm">
                        {#if maxFiles}
                            <span>You can upload {maxFiles} files</span>
                        {/if}
                        {#if maxFiles && maxFileSize}
                            <span>(up to {displaySize(maxFileSize)} each)</span>
                        {/if}
                        {#if maxFileSize && !maxFiles}
                            <span>Maximum size {displaySize(maxFileSize)}</span>
                        {/if}
                    </span>
                {/if}
                {#if onFolderUpload && isDesktop.current}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <label
                        for={folderId}
                        onclick={(e) => e.stopPropagation()}
                        class="text-primary hover:text-primary/80 mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
                    >
                        <FolderUpIcon class="size-4" />
                        <span>Or select a folder</span>
                    </label>
                {/if}
            </div>
        </div>
    {/if}
    <input
        {...rest}
        disabled={!canUploadFiles}
        {id}
        {accept}
        multiple={maxFiles === undefined || maxFiles - (fileCount ?? 0) > 1}
        type="file"
        onchange={change}
        class="hidden"
    />
    {#if onFolderUpload}
        <input
            disabled={!canUploadFiles}
            id={folderId}
            type="file"
            onchange={folderChange}
            class="hidden"
            webkitdirectory
        />
    {/if}
</label>
