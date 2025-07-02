import { auth } from '$lib/server/services/auth';
import { route } from '$lib/ROUTES';
import { redirect } from '@sveltejs/kit';

export const load = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (session?.user) {
		throw redirect(302, route('/'));
	}
};
