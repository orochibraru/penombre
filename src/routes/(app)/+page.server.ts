export const load = async ({ locals }) => {
	const files = await locals.storage.listObjects({
		folder: '',
		pagination: {
			page: 1,
			limit: 20
		}
	});

	return {
		files
	};
};
