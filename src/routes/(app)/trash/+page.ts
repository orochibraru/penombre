import { listFilesByCategory } from '$lib/api/helpers/storage';

export const load = async () => {
	return {
		files: listFilesByCategory('trash')
	};
};
