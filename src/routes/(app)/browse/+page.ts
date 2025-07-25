import { listFiles } from '$lib/api/helpers/storage';

export const load = async () => {
	return { files: listFiles() };
};
