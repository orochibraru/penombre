import { treaty } from '@elysiajs/eden';
import type { API } from '$lib/server/api';

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
