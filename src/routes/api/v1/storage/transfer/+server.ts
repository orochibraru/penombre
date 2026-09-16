import { DriveAccessError, ReadOnlyVolumeError } from "$lib/server/errors";
import { Http } from "$lib/server/http";
import { transferItems } from "$lib/server/openapi/v1/storage";
import type { StorageService } from "$lib/server/services/storage";
import { storageServiceFor } from "$lib/server/services/storage-for";
import { locationQuery } from "$lib/storage-location";

interface Item {
	path: string;
	type: "file" | "folder";
}

interface Transfer {
	source: StorageService;
	target: StorageService;
	folder: string;
	mode: "copy" | "move";
}

async function transferOne(
	item: Item,
	{ source, target, folder, mode }: Transfer,
): Promise<void> {
	const path = item.path.replace(/\/$/, "");
	const isFolder = item.type === "folder";

	if (mode === "move" && target.locationKey === source.locationKey) {
		await (isFolder
			? source.moveFolder(path, folder)
			: source.moveFile(path, folder));
		return;
	}

	const tree = await source.exportTree(path, item.type);
	const { failed } = await target.importTree(tree, folder, source);
	if (failed > 0) {
		throw new Error(`${failed} file(s) could not be copied`);
	}
	// Only once every byte has landed: a partial copy keeps its source.
	if (mode === "move") {
		await (isFolder ? source.deleteFolder(path) : source.deleteFile(path));
	}
}

export const POST = transferItems.handler(
	async ({ body, service, user, event }) => {
		const { folder, ...location } = body.destination;
		const target = await storageServiceFor(event.locals.storageOwner ?? user, {
			url: new URL(`/?${locationQuery(location)}`, event.url),
			locals: event.locals,
		});
		if (target.readOnly) {
			throw new ReadOnlyVolumeError("The destination is read-only");
		}
		if (body.mode === "move" && service.readOnly) {
			throw new ReadOnlyVolumeError("Items cannot be moved out of here");
		}

		const results: { path: string; success: boolean; error?: string }[] = [];
		for (const item of body.items) {
			try {
				await transferOne(item, {
					source: service,
					target,
					folder,
					mode: body.mode,
				});
				results.push({ path: item.path, success: true });
			} catch (error) {
				if (
					error instanceof DriveAccessError ||
					error instanceof ReadOnlyVolumeError
				) {
					throw error;
				}
				const message =
					error instanceof Error ? error.message : "Unknown error";
				results.push({ path: item.path, success: false, error: message });
			}
		}

		const successCount = results.filter((r) => r.success).length;
		return Http.Ok({
			results,
			successCount,
			failCount: results.length - successCount,
		});
	},
);
