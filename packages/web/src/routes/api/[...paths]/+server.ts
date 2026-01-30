import type { RequestHandler } from "@sveltejs/kit";
import { api } from "$lib/server/api";
import { debugLog } from "$lib/server/debug-log";

export const GET: RequestHandler = ({ request }) => {
	debugLog("SVELTEKIT", "GET request", { url: request.url });
	return api.fetch(request);
};

export const POST: RequestHandler = ({ request }) => {
	debugLog("SVELTEKIT", "POST request received", {
		url: request.url,
		contentType: request.headers.get("content-type"),
		contentLength: request.headers.get("content-length"),
	});
	return api.fetch(request);
};

export const PUT: RequestHandler = ({ request }) => {
	debugLog("SVELTEKIT", "PUT request", { url: request.url });
	return api.fetch(request);
};

export const DELETE: RequestHandler = ({ request }) => {
	debugLog("SVELTEKIT", "DELETE request", { url: request.url });
	return api.fetch(request);
};
