import { listFilesByCategory } from '$lib/api/helpers/storage';

export const load = async ({ params }) => {
	return {
		files: await listFilesByCategory(params.category),
		category: params.category
	};
};
