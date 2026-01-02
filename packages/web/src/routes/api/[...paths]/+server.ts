import type { RequestHandler } from "@sveltejs/kit";
import { api } from "$lib/server/api";

export const GET: RequestHandler = ({ request }) => api.fetch(request);
export const POST: RequestHandler = ({ request }) => api.fetch(request);
export const PUT: RequestHandler = ({ request }) => api.fetch(request);
export const DELETE: RequestHandler = ({ request }) => api.fetch(request);
