import type { RequestHandler } from "@sveltejs/kit";
import { Logger } from "$lib/logger";
import { api } from "$lib/server/api";

const logger = new Logger("API:ROUTING");

export const GET: RequestHandler = ({ request }) => {
	logger.debug("SVELTEKIT", "GET request", { url: request.url });
	return api.fetch(request);
};

export const POST: RequestHandler = ({ request }) => {
	logger.debug("SVELTEKIT", "POST request received", {
		url: request.url,
		contentType: request.headers.get("content-type"),
		contentLength: request.headers.get("content-length"),
	});
	return api.fetch(request);
};

export const PUT: RequestHandler = ({ request }) => {
	logger.debug("SVELTEKIT", "PUT request", { url: request.url });
	return api.fetch(request);
};

export const DELETE: RequestHandler = ({ request }) => {
	logger.debug("SVELTEKIT", "DELETE request", { url: request.url });
	return api.fetch(request);
};
