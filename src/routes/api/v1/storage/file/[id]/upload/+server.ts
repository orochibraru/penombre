import { Http } from "#lib/server/http.js";
import { uploadFile } from "#lib/server/openapi/v1/storage.js";

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

		try {
			await service.uploadFileBody(params.id, file, {
				snapshot: query.snapshot !== "0",
			});
			return Http.Ok({
				message: "File uploaded successfully.",
			});
		} catch (err) {
			return Http.ServerError("Upload error", err);
		}
	},
);
