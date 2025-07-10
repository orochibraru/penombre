import { error } from '@sveltejs/kit';
import { bridge } from '$lib/client/api';

export const load = async ({ locals, url }) => {
	const { api } = bridge(url, locals.authCookie);
	const { data, error: err } = await api.v1.storage.objects.get({ query: {} });

	if (err) {
		locals.logger.error(err);
		const val = err.value as string;
		return error(err.status, val);
	}

	return {
		files: data
	};
};
