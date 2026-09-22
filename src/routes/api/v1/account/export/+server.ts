import { Http } from "#lib/server/http.js";
import { exportAccountFiles } from "#lib/server/openapi/v1/account.js";

export const GET = exportAccountFiles.handler(async ({ service }) => {
	try {
		const stream = await service.createAccountExport();
		if (!stream) {
			return Http.NotFound("Nothing to export");
		}
		return new Response(stream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": 'attachment; filename="penombre-export.zip"',
				"Cache-Control": "no-cache",
			},
		});
	} catch (error) {
		return Http.ServerError("Failed to export account files", error);
	}
});
