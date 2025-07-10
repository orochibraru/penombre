import { treaty } from '@elysiajs/eden';
import type { API } from '$lib/server/api';

/**
 * Creates a client for the given API endpoint, using the given token as authentication.
 *
 * The client is configured to send a cookie with the given token, and to abort the request after 10 seconds.
 *
 * @param url The URL of the API endpoint.
 * @param token The authentication token.
 * @returns The client.
 */
export function bridge(url: URL, token: string) {
	const headers = new Headers();

	headers.append('cookie', token);

	const controller = new AbortController();

	const cancelRequest = setTimeout(() => {
		controller.abort();
	}, 10000);

	const client = treaty<API>(url.origin, {
		headers,
		fetch: {
			signal: controller.signal
		}
	});

	clearTimeout(cancelRequest);

	return client;
}
