import { route } from '$lib/ROUTES';
import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
    if (!locals.user) {
        throw redirect(307, route('/auth/sign-in'));
    }

    return {
        user: locals.user,
        isAdmin: locals.isAdmin,
        impersonating: locals.impersonating
    };
};
