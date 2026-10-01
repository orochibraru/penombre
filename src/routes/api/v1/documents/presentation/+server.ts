import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import { Http } from "#lib/server/http.js";
import { templatePackage } from "#lib/server/office/slides/index.js";
import { createPresentation } from "#lib/server/openapi/v1/presentations.js";

export const POST = createPresentation.handler(async ({ body, service }) => {
	const bytes = templatePackage(body.template, body.name);
	if (!bytes) {
		return Http.BadRequest(`Unknown template ${body.template}`);
	}
	try {
		const created = await service.createFile(
			{ name: `${body.name}.pptx`, size: bytes.byteLength },
			body.folder,
		);
		if (!created.id) {
			return Http.ServerError("Failed to create the presentation", created);
		}
		await service.uploadFileBody(created.id, bytes, { snapshot: false });
		return Http.Ok({
			id: created.id,
			name: created.metadata.name ?? `${body.name}.pptx`,
		});
	} catch (error) {
		if (error instanceof FileOrFolderNotFoundError) {
			return Http.BadRequest("Destination folder not found");
		}
		return Http.ServerError("Failed to create the presentation", error);
	}
});
