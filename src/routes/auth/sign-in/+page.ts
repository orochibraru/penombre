import { redirect } from '@sveltejs/kit';
import { getProviders, getUser } from '$lib/api/helpers/auth';
import { route } from '$lib/ROUTES';

export const load = async () => {
	const { data: providers, err } = await getProviders();

	if (err) {
		return { providers: [] };
	}

	// If user is signed in they have no business here.
	const { data: userSession } = await getUser();
	if (userSession?.session) {
		return redirect(307, route('/'));
	}

	return {
		providers: providers ?? []
	};
};
