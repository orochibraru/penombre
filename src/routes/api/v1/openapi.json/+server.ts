import { json } from "@sveltejs/kit";
import { Logger } from "$lib/logger";
import { genOpenApiSpec } from "$lib/server/generate-openapi";

const logger = new Logger("openapi+server");

export const GET = async () => {
	try {
		return json(await genOpenApiSpec(), {
			headers: {
				"Cache-Control": "public, max-age=60",
			},
		});
	} catch (error) {
		logger.error("Error generating OpenAPI spec:", error);
		return json(
			{ message: "Failed to generate OpenAPI spec" },
			{ status: 500 },
		);
	}
};
