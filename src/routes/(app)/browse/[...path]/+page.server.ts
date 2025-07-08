import { bridge } from '$lib/client/api';
import { route } from '$lib/ROUTES';
import { error } from '@sveltejs/kit';

type Crumb = {
	title: string;
	href: string;
};

export const load = async ({ locals, url, params }) => {
	const { api } = bridge(url, locals.authCookie);

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

	const folders = params.path.split('/');

	const crumbs: Crumb[] = [];
	const chain: string[] = [];
	for (const folder of folders) {
		crumbs.push({
			title: folder,
			href: route('/browse/[...path]', {
				path: [...chain, folder]
			})
		});
		chain.push(folder);
	}

	return {
		files: data,
		title: folders[folders.length - 1],
		folders,
		crumbs
	};
};
