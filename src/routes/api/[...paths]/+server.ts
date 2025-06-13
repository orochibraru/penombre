import { type RequestHandler, router } from '$lib/server/api';

export const GET: RequestHandler = ({ request }) => router.handle(request);
export const POST: RequestHandler = ({ request }) => router.handle(request);
export const PUT: RequestHandler = ({ request }) => router.handle(request);
export const DELETE: RequestHandler = ({ request }) => router.handle(request);
