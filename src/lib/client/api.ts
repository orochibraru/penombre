import type { API } from '$lib/server/api';
import { treaty } from '@elysiajs/eden';

export function bridge(url: URL, token: string) {
	const headers = new Headers();

	headers.append('cookie', token);

	const controller = new AbortController();

	const cancelRequest = setTimeout(() => {
		console.info('Aborting request.');
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
