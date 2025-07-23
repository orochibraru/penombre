import { error } from '@sveltejs/kit';
import { listFiles } from '$lib/api/helpers/storage';
import { route } from '$lib/ROUTES';

type Crumb = {
	title: string;
	href: string;
};

export const load = async ({ params }) => {
	const { data: files, err } = await listFiles(params.path);

	if (err) {
		return error(err.code, err.message);
	}

	const folders = params.path.split('/');

	const crumbs: Crumb[] = [];
	const chain: string[] = [];

	crumbs.push({
		title: 'My Drive',
		href: route('/browse')
	});

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
		files,
		title: folders[folders.length - 1],
		folders,
		crumbs
	};
};
