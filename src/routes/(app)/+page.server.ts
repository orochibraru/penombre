export const load = async ({ locals }) => {
	const files = await locals.storage.listObjects({
		folder: ''
	});

	return {
		files
	};
};
