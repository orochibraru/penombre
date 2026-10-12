import { Http } from "#lib/server/http.js";
import { uploadFile } from "#lib/server/openapi/v1/storage.js";
import {
	oneSaveAtATime,
	revisionOf,
} from "#lib/server/services/storage/revision.js";

export const POST = uploadFile.handler(
	async ({ params, query, event, service }) => {
		let formData: FormData;
		try {
			formData = await event.request.formData();
		} catch (err) {
			return Http.ServerError("Failed to parse formdata", err);
		}

		const file = formData.get("file") as File | null;
		if (!file) {
			return Http.BadRequest("No file provided");
		}

		const filePath = await service.findFileById(params.id);
		if (!filePath) {
			return Http.BadRequest(`File ${params.id} not found`);
		}

		const fileData = await service.getFile(filePath);
		if (!fileData) {
			return Http.BadRequest(`File ${params.id} not found`);
		}

		const write = () =>
			service.uploadFileBody(params.id, file, {
				snapshot: query.snapshot !== "0",
				modifiedAt: query.mtime ? new Date(query.mtime) : undefined,
			});

		try {
			const { base } = query;
			if (!base) {
				await write();
				return Http.Ok({ message: "File uploaded successfully." });
			}
			// An editor's save: only over the bytes it was edited from.
			return await oneSaveAtATime(params.id, async () => {
				const raw = await service.getRawFileData(filePath);
				const current = raw && revisionOf(raw.buffer);
				if (current && current !== base) {
					return Http.Conflict("The file changed since it was opened.", {
						revision: current,
					});
				}
				await write();
				return Http.Ok({
					message: "File uploaded successfully.",
					revision: revisionOf(await file.arrayBuffer()),
				});
			});
		} catch (err) {
			return Http.ServerError("Upload error", err);
		}
	},
);
