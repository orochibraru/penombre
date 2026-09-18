import { Logger } from "#lib/logger.js";
import { genOpenApiSpec } from "#lib/server/generate-openapi.js";

const logger = new Logger("openapi+server");

export const GET = async () => {
	try {
		return Response.json(await genOpenApiSpec(), {
			headers: {
				"Cache-Control": "public, max-age=60",
			},
		});
	} catch (error) {
		logger.error("Error generating OpenAPI spec:", error);
		return Response.json(
			{ message: "Failed to generate OpenAPI spec" },
			{ status: 500 },
		);
	}
};
