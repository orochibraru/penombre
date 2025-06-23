import { error } from '@sveltejs/kit';

const availableCategories = ['music', 'documents', 'images'];

export const load = ({ params }) => {
	const category = params.category;

	if (!availableCategories.includes(category)) {
		return error(400, `Unable to resolve category ${category}`);
	}

	return {
		category
	};
};
