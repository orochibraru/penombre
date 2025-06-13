import { route } from '$lib/ROUTES';
import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
    if (locals.user) {
        throw redirect(302, route('/'));
    }
};
