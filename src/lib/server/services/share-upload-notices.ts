/** Wires the upload notice batcher to the bell and the mailbox. */

import { eq } from "drizzle-orm";

import { getConfig, isSimpleMode } from "#lib/server/config.js";
import { db } from "#lib/server/db/index.js";
import { folders } from "#lib/server/db/schema.js";
import { loadSharedOwner } from "#lib/server/services/library-scan.js";
import { NotificationService } from "#lib/server/services/notifications.js";
import { folderHref } from "#lib/server/services/shortcuts.js";
import {
	type UploadNotice,
	UploadNoticeBatcher,
} from "#lib/server/services/upload-notice-batcher.js";

/** Where the recipient opens the folder, resolved when the notice is sent. */
async function deliver(batch: UploadNotice & { count: number }) {
	const [folder] = await db
		.select()
		.from(folders)
		.where(eq(folders.id, batch.folderId))
		.limit(1);
	const storageOwner = isSimpleMode()
		? ((await loadSharedOwner())?.id ?? batch.recipientId)
		: batch.recipientId;
	const link = folder
		? await folderHref(folder, batch.recipientId, storageOwner)
		: null;
	await new NotificationService().notify(
		{
			userId: batch.recipientId,
			type: "share_upload",
			resourceName: batch.folderName,
			link,
			count: batch.count,
		},
		getConfig().origin,
	);
}

// On globalThis so a dev HMR reload keeps one batch per link.
const holder = globalThis as { __shareUploadNotices?: UploadNoticeBatcher };
export const uploadNotices = (holder.__shareUploadNotices ??=
	new UploadNoticeBatcher(deliver));

/** One file landed through a link; its creator is told once per burst. */
export function noteLinkUpload(
	share: { id: string; ownerId: string; resourceId: string },
	folderName: string | undefined,
	uploader: { user?: { id: string } | null },
): void {
	// A signed-in creator testing their own link needs no bell.
	if (uploader.user?.id === share.ownerId) {
		return;
	}
	uploadNotices.record({
		shareId: share.id,
		recipientId: share.ownerId,
		folderId: share.resourceId,
		folderName: folderName ?? "",
	});
}
