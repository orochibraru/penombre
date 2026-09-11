/**
 * Folder-tree preparation for the upload dialog.
 *
 * Browser folder uploads give us files carrying a `relativePath`; before the
 * files themselves can be uploaded, every nested folder in those paths has to
 * exist server-side. This module creates the missing ones (reusing any that are
 * already there) and returns the display-path → folder-UUID mapping the upload
 * step needs.
 */

import { page } from "$app/state";
import { api, type UploadResult } from "$lib/api";

export type FileWithPath = File & { relativePath?: string };

/**
 * Every nested folder path implied by the uploaded files.
 *
 * `keepRoot` decides what happens to the folder the user actually picked. With
 * it, "MyFolder/a/b/file.txt" yields "MyFolder", "MyFolder/a" and
 * "MyFolder/a/b"; without it the enclosing folder is dropped and its contents
 * land in the folder being browsed, yielding "a" and "a/b".
 */
function collectFolderPaths(
	folderFiles: FileWithPath[],
	keepRoot: boolean,
): Set<string> {
	const folderPaths = new Set<string>();
	const first = keepRoot ? 1 : 2;
	const from = keepRoot ? 0 : 1;

	for (const file of folderFiles) {
		if (!file.relativePath) {
			continue;
		}
		const parts = file.relativePath.split("/");
		// Stop before the filename.
		for (let i = first; i < parts.length; i++) {
			folderPaths.add(parts.slice(from, i).join("/"));
		}
	}

	return folderPaths;
}

/** Group paths by nesting depth so same-depth folders can be created in parallel */
function groupPathsByDepth(folderPaths: Set<string>): Map<number, string[]> {
	const pathsByDepth = new Map<number, string[]>();

	for (const p of folderPaths) {
		const depth = p.split("/").length;
		const group = pathsByDepth.get(depth);
		if (group) {
			group.push(p);
		} else {
			pathsByDepth.set(depth, [p]);
		}
	}

	return pathsByDepth;
}

/** Existing folders as lowercased display path → UUID, or null if the tree is unavailable */
async function fetchExistingFolders(): Promise<Map<string, string> | null> {
	try {
		const { data: treeData } = await api.GET("/api/v1/storage/folder/tree");
		if (treeData?.data) {
			return new Map(treeData.data.map((f) => [f.path.toLowerCase(), f.id]));
		}
	} catch {
		// no tree available; the caller falls through and attempts every folder
	}
	return null;
}

/** Translate a display path into the UUID path the API expects */
function buildParentUuidPath(
	parentParts: string[],
	folderPathToUuid: Map<string, string>,
): string {
	let parentUuidPath = page.params.path || "";

	for (const [index] of parentParts.entries()) {
		const uuid = folderPathToUuid.get(
			parentParts.slice(0, index + 1).join("/"),
		);
		if (uuid) {
			parentUuidPath = parentUuidPath ? `${parentUuidPath}/${uuid}` : uuid;
		}
	}

	return parentUuidPath;
}

/** Absolute display path of a folder, including the folder we are browsing */
function buildFullDisplayPath(
	parentDisplayPath: string,
	folderName: string,
): string {
	return [page.params.path, parentDisplayPath, folderName]
		.filter(Boolean)
		.join("/");
}

/** Create one folder (or reuse the existing one), recording its UUID */
async function ensureFolder(
	folderPath: string,
	folderPathToUuid: Map<string, string>,
	existingFolders: Map<string, string> | null,
): Promise<void> {
	const parts = folderPath.split("/");
	const folderName = parts[parts.length - 1] ?? "";
	const parentParts = parts.slice(0, -1);
	const fullDisplayPath = buildFullDisplayPath(
		parentParts.join("/"),
		folderName,
	);

	const existingUuid = existingFolders?.get(fullDisplayPath.toLowerCase());
	if (existingUuid) {
		folderPathToUuid.set(folderPath, existingUuid);
		return;
	}

	try {
		const { data: folderData } = await api.POST("/api/v1/storage/folder", {
			body: {
				name: folderName,
				parent: buildParentUuidPath(parentParts, folderPathToUuid) || undefined,
			},
		});

		if (folderData?.data) {
			const folderId = folderData.data.id;
			folderPathToUuid.set(folderPath, folderId);
			// Cache it locally so a sibling path doesn't try to create it again
			existingFolders?.set(fullDisplayPath.toLowerCase(), folderId);
		}
	} catch {
		// folder creation failed; the per-file upload reports it
	}
}

/**
 * Create every folder the uploaded files need, parents first.
 * Returns a map of display-name path → folder UUID.
 */
export async function createFoldersForUpload(
	folderFilesSnapshot: FileWithPath[],
	keepRoot: boolean,
): Promise<Map<string, string>> {
	const folderPathToUuid = new Map<string, string>();
	const pathsByDepth = groupPathsByDepth(
		collectFolderPaths(folderFilesSnapshot, keepRoot),
	);
	const existingFolders = await fetchExistingFolders();

	// Level by level, so a folder's parent always exists before we create it
	for (const depth of Array.from(pathsByDepth.keys()).sort((a, b) => a - b)) {
		await Promise.all(
			(pathsByDepth.get(depth) ?? []).map((folderPath) =>
				ensureFolder(folderPath, folderPathToUuid, existingFolders),
			),
		);
	}

	return folderPathToUuid;
}

export interface FullResult {
	data: UploadResult;
	file: File;
}

/** One file queued for upload, under the display name it should be stored as */
interface QueuedFile {
	file: File;
	name: string;
}

/** UUID path of the folder a relative display path maps to, rooted at the current folder */
function resolveFolderUuidPath(
	displayFolderPath: string,
	folderPathToUuid: Map<string, string>,
): string {
	let folderUuidPath = page.params.path || "";
	if (!displayFolderPath) {
		return folderUuidPath;
	}

	const folderParts = displayFolderPath.split("/");
	for (const [index] of folderParts.entries()) {
		const uuid = folderPathToUuid.get(
			folderParts.slice(0, index + 1).join("/"),
		);
		if (uuid) {
			folderUuidPath = folderUuidPath ? `${folderUuidPath}/${uuid}` : uuid;
		}
	}

	return folderUuidPath;
}

/**
 * Bucket every file by the UUID path of the folder it belongs in, so metadata
 * can be created one batch request per folder.
 */
export function groupFilesByFolder(
	regularFiles: File[],
	folderFiles: FileWithPath[],
	folderPathToUuid: Map<string, string>,
	keepRoot: boolean,
): Record<string, QueuedFile[]> {
	const filesByFolder: Record<string, QueuedFile[]> = {};

	const push = (folderUuidPath: string, entry: QueuedFile) => {
		const group = filesByFolder[folderUuidPath];
		if (group) {
			group.push(entry);
		} else {
			filesByFolder[folderUuidPath] = [entry];
		}
	};

	// Regular files all land in the folder currently being browsed
	for (const file of regularFiles) {
		push(page.params.path || "", { file, name: file.name });
	}

	for (const file of folderFiles) {
		const pathParts = (file.relativePath || file.name).split("/");
		const fileName = pathParts[pathParts.length - 1] ?? file.name;
		// Always drop the filename; the root folder stays only when asked for.
		const displayFolderPath = keepRoot
			? pathParts.slice(0, -1).join("/")
			: pathParts.length > 2
				? pathParts.slice(1, -1).join("/")
				: "";

		push(resolveFolderUuidPath(displayFolderPath, folderPathToUuid), {
			file,
			name: fileName,
		});
	}

	return filesByFolder;
}

/** Create metadata rows for one folder's files, `batchSize` at a time */
async function createFolderMetadata(
	folder: string,
	filesInFolder: QueuedFile[],
	batchSize: number,
): Promise<Array<{ result: FullResult; displayName: string }>> {
	const folderResults: Array<{ result: FullResult; displayName: string }> = [];

	for (let i = 0; i < filesInFolder.length; i += batchSize) {
		const chunk = filesInFolder.slice(i, i + batchSize);

		const { data: batchData, error: batchError } = await api.POST(
			"/api/v1/storage/file/batch",
			{
				params: { query: { folder: folder || undefined } },
				body: {
					files: chunk.map((item) => ({
						name: item.name,
						size: item.file.size,
					})),
				},
			},
		);

		if (batchError || !batchData?.data) {
			throw new Error(
				`Failed to create batch metadata: ${JSON.stringify(batchError)}`,
			);
		}

		const batchResults = batchData.data as unknown as UploadResult[];
		for (const [index, fileItem] of chunk.entries()) {
			const uploadResult = batchResults[index];
			if (!uploadResult) {
				continue;
			}
			folderResults.push({
				result: { data: uploadResult, file: fileItem.file },
				displayName: fileItem.name,
			});
		}
	}

	return folderResults;
}

/** Create metadata for every queued file, one parallel track per folder */
export async function createUploadMetadata(
	filesByFolder: Record<string, QueuedFile[]>,
	batchSize: number,
): Promise<Array<{ result: FullResult; displayName: string }>> {
	const allFolderResults = await Promise.all(
		Object.entries(filesByFolder).map(([folder, filesInFolder]) =>
			createFolderMetadata(folder, filesInFolder, batchSize),
		),
	);
	return allFolderResults.flat();
}
