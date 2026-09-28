import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { getDb } from "#lib/server/db/index.js";
import { folders } from "#lib/server/db/schema.js";
import { folderHref } from "#lib/server/services/shortcuts.js";

/**
 * A folder link anyone on the instance can open: each viewer is sent to
 * wherever they can reach it (`folderHref`). 404, never 403, when they
 * cannot, so a guessed id does not reveal that it exists.
 */
export const GET = async ({ params, locals }) => {
	const viewer = locals.user;
	if (!viewer) {
		return redirect(303, "/auth/sign-in");
	}

	const [folder] = await getDb()
		.select()
		.from(folders)
		.where(and(eq(folders.id, params.id), eq(folders.isTrashed, false)));
	const href =
		folder && (await folderHref(folder, viewer.id, locals.storageOwner?.id));
	if (!href) {
		return error(404, "Folder not found");
	}
	return redirect(303, href);
};
