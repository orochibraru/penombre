import { error } from '@sveltejs/kit';
import { bridge } from '$lib/client/api';
import { allowedFileCategories } from '$lib/server/services/storage';

export const load = async ({ params, locals, url }) => {
	const category = params.category;

	if (!allowedFileCategories.includes(category)) {
		return error(400, `Unable to resolve category ${category}`);
	}

	const { api } = bridge(url, locals.authCookie);

	const { data: files, error: err } = await api.v1.storage.objects({ category }).get();

	if (err) {
		locals.logger.error(err);
		const val = err.value as string;

		return error(err.status, val);
	}

	return { files, category };
};
