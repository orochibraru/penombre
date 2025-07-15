import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { route } from '$lib/ROUTES';
import { uploadSchema } from '$lib/schemas/upload';
import { auth } from '$lib/server/services/auth';
import { getMinioUrl } from '$lib/server/services/storage';

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
		token: locals.authCookie,
		minioUrl: getMinioUrl(),
		uploadForm: await superValidate({}, valibot(uploadSchema))
	};
};
