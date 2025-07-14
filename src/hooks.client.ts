import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, event, message }) => {
	const errorId = crypto.randomUUID();

	console.error('An error occurred on the client side:', error, event, message);

	return {
		message: 'Whoops!',
		errorId
	};
};
