export const load = async ({ locals }) => {
	const files = await locals.storage.listRecentObjects({
		page: 1,
		limit: 10
	});

	return { files };
};
