import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { getUser } from '$lib/api/helpers/auth';
import { route } from '$lib/ROUTES';
import { uploadSchema } from '$lib/schemas/upload';

export const load = async () => {
	const { data: userSession, err } = await getUser();
	if (err) {
		if (err.code === 401) {
			return redirect(307, route('/auth/sign-in'));
		}
		return error(err.code, err.message);
	}

	return {
		user: userSession.user,
		session: userSession.session,
		uploadForm: await superValidate({}, valibot(uploadSchema))
	};
};
