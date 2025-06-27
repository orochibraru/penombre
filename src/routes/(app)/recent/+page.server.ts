export const load = async ({ locals }) => {
	const files = await locals.storage.listRecentObjects();

	return { files };
};
