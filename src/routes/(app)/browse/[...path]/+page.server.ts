import { bridge } from '$lib/client/api';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, url, params }) => {
	const { api } = bridge(url, locals.authCookie);
	const { data: folderExists } = await api.v1.storage.objects.get({
		query: {
			folder: params.path
		}
	});
	if (!folderExists) {
		return error(404, `Folder "${params.path}" does not exist.`);
	}

	const { data, error: err } = await api.v1.storage.objects.get({
		query: {
			folder: params.path
		}
	});

	if (err) {
		locals.logger.error(err);
		const val = err.value as string;
		return error(err.status, val);
	}

	return {
		files: data,
		folders: params.path.split('/')
	};
};
