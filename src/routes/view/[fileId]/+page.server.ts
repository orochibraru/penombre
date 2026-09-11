import { error, redirect } from "@sveltejs/kit";

/**
 * Full-screen viewer for one media file.
 *
 * Lives outside `(app)` on purpose: it is what a new tab opens, and the
 * sidebar, header and bottom bar are exactly what is not wanted there.
 */
export const load = async ({ params, locals }) => {
	if (!locals.user) {
		return redirect(302, "/auth/sign-in");
	}

	const service = locals.storageService;
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
