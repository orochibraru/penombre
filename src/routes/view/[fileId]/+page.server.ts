import { error, redirect } from "@sveltejs/kit";
import { storageServiceFor } from "$lib/server/services/drives";

/**
 * Full-screen viewer for one media file.
 *
 * Lives outside `(app)` on purpose: the sidebar, header and bottom bar are
 * exactly what a full-screen viewer must not have.
 */
export const load = async ({ params, url, locals }) => {
	if (!locals.user) {
		return redirect(302, "/auth/sign-in");
	}

	// `?drive=` rather than a route parameter: this route is not under
	// `/drives`, so a shared drive's file is only addressable by carrying it.
	const service = await storageServiceFor(locals.storageOwner ?? locals.user, {
		url,
		locals,
	});
	const path = await service.findFileById(params.fileId);
	if (!path) {
		return error(404, "That file does not exist.");
	}

	const item = await service.handleMetadata(path);

	return {
		fileId: params.fileId,
		path,
		name: item.metadata.name ?? path.split("/").pop() ?? path,
		contentType: item.metadata.contentType ?? "application/octet-stream",
		category: item.metadata.category ?? null,
		size: item.size ?? 0,
		userId: locals.user.id,
	};
};
