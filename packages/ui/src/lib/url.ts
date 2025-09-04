import { page } from '$app/state';
import { api, type ObjectItem } from '$lib/api';

export async function getProxiedObjectUrl(item: ObjectItem) {
	const fullPath = page.params.path ? `${page.params.path}/${item.key}` : item.key;

	const { data: presignedUrl, error: err } = await api.GET('/api/v1/storage/objects/url', {
		params: {
			query: {
				item: fullPath
			}
		}
	});

	if (err) {
		console.error(err);
		throw err;
	}

	const finalUrl = `${page.url.origin}/p?url=${presignedUrl}`;

	return finalUrl;
}
