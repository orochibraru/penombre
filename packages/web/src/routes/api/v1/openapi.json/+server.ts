import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Side-effect: registers all route definitions + shared schemas
import "$lib/server/openapi/routes";
import { registry } from "$lib/server/openapi";

export const GET: RequestHandler = async () => {
	const spec = registry.toOpenAPISpec();
	return json(spec, {
		headers: {
			"Cache-Control": "public, max-age=60",
		},
	});
};
