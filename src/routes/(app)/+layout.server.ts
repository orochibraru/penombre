import { route } from '$lib/ROUTES';
import { auth } from '$lib/auth';
import { StorageService } from '$lib/server/storage';
import { redirect } from '@sveltejs/kit';

export const load = async ({ request }) => {
	const storage = new StorageService();
	const authStatus = await auth.api.getSession({
		headers: request.headers
	});

	if (!authStatus) {
		throw redirect(307, route('/auth/sign-in'));
	}

	const buckets = await storage.listBuckets();
	console.info('buckets', buckets);

	return {
		user: authStatus.user,
		session: authStatus.session
	};
};
