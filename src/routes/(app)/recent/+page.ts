import { error } from '@sveltejs/kit';
import { listRecentFiles } from '$lib/api/helpers/storage';

export const load = async () => {
	const { data: files, err } = await listRecentFiles();

	if (err) {
		return error(err.code, err.message);
	}

	return { files };
};
