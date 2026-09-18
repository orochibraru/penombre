/**
 * Copying a file or a folder's subtree between two storage services — two
 * drives, a drive and a volume, or the same drive twice (duplicating a folder).
 *
 * Export reads rows from the source; import creates fresh rows and bytes in
 * the target. Nothing is shared between the two but the rows and a way to open
 * each file, so the target never needs to know where the source is rooted.
 */

import { and, asc, eq, like } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import type {
	File as DbFile,
	Folder as DbFolder,
} from "#lib/server/db/schema.js";
import { files, folders } from "#lib/server/db/schema.js";
import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import type { StorageContext } from "./context";
import type { FileOperations } from "./files";
import type { FolderOperations } from "./folders";
import { ownedFiles, ownedFolders } from "./scope";

const logger = new Logger("StorageTransfer");

export interface ExportedTree {
	type: "file" | "folder";
	/** The folder itself for a folder export; absent for a file. */
	root?: DbFolder;
	/** Descendant folders, parents before children. */
	folders: DbFolder[];
	files: DbFile[];
}

export interface TransferResult {
	copied: number;
	failed: number;
}

export type OpenFile = (path: string) => Promise<ReadableStream<Uint8Array>>;

function parentOf(path: string): string {
	return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

export class TransferOperations {
	constructor(
		private readonly ctx: StorageContext,
		private readonly fileOps: FileOperations,
		private readonly folderOps: FolderOperations,
	) {}

	/** Trashed descendants stay behind: the trash is not part of what moves. */
	async exportTree(
		key: string,
		type: "file" | "folder",
	): Promise<ExportedTree> {
		const path = key.replace(/\/$/, "");
		if (type === "file") {
			const [file] = await this.ctx.db
				.select()
				.from(files)
				.where(and(eq(files.path, path), ownedFiles(this.ctx)));
			if (!file) {
				throw new FileOrFolderNotFoundError(`File not found: ${path}`);
			}
			return { type, folders: [], files: [file] };
		}

		const [root] = await this.ctx.db
			.select()
			.from(folders)
			.where(and(eq(folders.path, path), ownedFolders(this.ctx)));
		if (!root) {
			throw new FileOrFolderNotFoundError(`Folder not found: ${path}`);
		}
		const [subFolders, subFiles] = await Promise.all([
			this.ctx.db
				.select()
				.from(folders)
				.where(
					and(
						ownedFolders(this.ctx),
						like(folders.path, `${path}/%`),
						eq(folders.isTrashed, false),
					),
				)
				.orderBy(asc(folders.path)),
			this.ctx.db
				.select()
				.from(files)
				.where(
					and(
						ownedFiles(this.ctx),
						like(files.path, `${path}/%`),
						eq(files.isTrashed, false),
					),
				),
		]);
		// Path order is not depth order once ids differ in length; depth is.
		subFolders.sort(
			(a, b) => a.path.split("/").length - b.path.split("/").length,
		);
		return { type, root, folders: subFolders, files: subFiles };
	}

	/** The folders of a tree under `dest`, keyed by their old path. */
	private async recreateFolders(
		root: DbFolder,
		descendants: DbFolder[],
		dest: string,
	): Promise<Map<string, string>> {
		const newPathOf = new Map<string, string>();
		const created = await this.folderOps.createFolder(
			root.name,
			dest || undefined,
		);
		newPathOf.set(root.path, dest ? `${dest}/${created.id}` : created.id);
		for (const folder of descendants) {
			const parent = newPathOf.get(parentOf(folder.path));
			if (parent !== undefined) {
				const child = await this.folderOps.createFolder(folder.name, parent);
				newPathOf.set(folder.path, `${parent}/${child.id}`);
			}
		}
		return newPathOf;
	}

	async importTree(
		tree: ExportedTree,
		destination: string,
		open: OpenFile,
	): Promise<TransferResult> {
		const dest = destination.replace(/\/$/, "");
		const newPathOf = tree.root
			? await this.recreateFolders(tree.root, tree.folders, dest)
			: new Map<string, string>();

		const result: TransferResult = { copied: 0, failed: 0 };
		for (const file of tree.files) {
			const folder = tree.root ? newPathOf.get(parentOf(file.path)) : dest;
			if (folder === undefined) {
				result.failed++;
				continue;
			}
			try {
				await this.fileOps.importFile(file, folder, await open(file.path));
				result.copied++;
			} catch (error) {
				logger.warn(`Could not copy ${file.path}`, error);
				result.failed++;
			}
		}
		await this.ctx.invalidateListingCaches();
		return result;
	}
}
