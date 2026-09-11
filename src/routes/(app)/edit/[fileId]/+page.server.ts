import { error } from "@sveltejs/kit";

export const load = async ({ params, locals }) => {
	const service = locals.storageService;
	const path = await service.findFileById(params.fileId);
	if (!path) {
		return error(404, "That document does not exist.");
	}

	const raw = await service.getRawFileData(path);
	if (!raw) {
		return error(404, "That document has no content yet.");
	}

	return {
		fileId: params.fileId,
		name: raw.meta.metadata.name ?? params.fileId,
		contentType: raw.meta.metadata.contentType ?? "text/plain",
		// Text by definition: only the three editable kinds route here, and
		// each of them stores a text format.
		content: new TextDecoder().decode(raw.buffer),
	};
};
