import { listFiles } from '$lib/api/helpers/storage';
import { route } from '$lib/ROUTES';
import type { BreadCrumb } from '$lib/utils';

export const load = async ({ params }) => {
	const folders = params.path.split('/');

	const crumbs: BreadCrumb[] = [];
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
		files: listFiles(params.path),
		title: folders[folders.length - 1],
		folders,
		crumbs
	};
};
