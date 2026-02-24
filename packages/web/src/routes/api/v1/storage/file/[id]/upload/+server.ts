import { Http } from "$lib/server/http";
import { uploadFile } from "$lib/server/openapi/v1/storage";

export const POST = uploadFile.handler(async ({ params, event, service }) => {
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

	const exists = await service.fileExistsById(params.id);
	if (!exists) {
		return Http.BadRequest(`File ${params.id} not found`);
	}

	try {
		await service.uploadFileBody(params.id, file);
		return Http.Ok({
			message: "File uploaded successfully.",
		});
	} catch (err) {
		return Http.ServerError("Upload error", err);
	}
});
