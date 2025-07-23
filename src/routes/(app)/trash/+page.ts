import { error } from '@sveltejs/kit';
import { listFilesByCategory } from '$lib/api/helpers/storage';

export const load = async () => {
	const { data: files, err } = await listFilesByCategory('trash');

	if (err) {
		return error(err.code, err.message);
	}

	return {
		files
	};
};
