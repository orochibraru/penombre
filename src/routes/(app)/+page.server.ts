import { route } from '$lib/ROUTES';
import { redirect } from '@sveltejs/kit';

export const load = () => {
	throw redirect(307, route('/browse'));
};
