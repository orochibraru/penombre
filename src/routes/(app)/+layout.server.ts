import { redirect } from '@sveltejs/kit';
import { route } from '$lib/ROUTES';
import { uploadQueue } from '$lib/server/queues';
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

	const queue = uploadQueue();

	const jobs = await queue?.listJobs();

	// await uploadQueue.cleanup()

	return {
		user,
		session,
		token: locals.authCookie,
		jobs,
		minioUrl: getMinioUrl()
	};
};
