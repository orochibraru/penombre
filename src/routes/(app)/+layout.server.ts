import { auth } from '$lib/server/services/auth';
import { route } from '$lib/ROUTES';
import { redirect } from '@sveltejs/kit';

export const load = async ({ request, locals }) => {
	const authStatus = await auth.api.getSession({
		headers: request.headers
	});

	if (!authStatus) {
		throw redirect(307, route('/auth/sign-in'));
	}

	const { user, session } = authStatus;

	return {
		user,
		session,
		token: locals.authCookie
	};
};
