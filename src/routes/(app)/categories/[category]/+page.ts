import { error } from '@sveltejs/kit';
import { listFilesByCategory } from '$lib/api/helpers/storage';

export const load = async ({ params }) => {
	const { data: files, err } = await listFilesByCategory(params.category);

	if (err) {
		return error(err.code, err.message);
	}

	return {
		files,
		category: params.category
	};
};
