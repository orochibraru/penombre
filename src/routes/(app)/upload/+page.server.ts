import { fail, message, setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from './schema';
import { bridge } from '$lib/client/api';
import type { CustomReq } from './model';

export const load = async () => {
	return {
		form: await superValidate({}, valibot(schema))
	};
};

export const actions = {
	default: async ({ request, locals, url }) => {
		const form = await superValidate(request, valibot(schema));

		const { logger } = locals;

		if (!form.valid) {
			return fail(400, { form });
		}

		const { api } = bridge(url, locals.authCookie);

		const requests: CustomReq[] = [];

		for (const file of form.data.attachments) {
			requests.push({
				file: file.name,
				error: false,
				fullfilled: false,
				errorMessage: '',
				promise: api.v1.storage.objects
					.post(file)
					.then((res) => {
						const reqItem = requests.find((req) => req.file === file.name);
						if (!reqItem) {
							throw new Error('Cannot find req item!');
						}

						reqItem.fullfilled = true;

						if (res.error) {
							logger.error(res.error);
							reqItem.error = true;
							reqItem.errorMessage = JSON.stringify(res.error.value);
						}
					})
					.catch((e) => {
						logger.error(e);
						const reqItem = requests.find((req) => req.file === file.name);
						if (!reqItem) {
							throw new Error('Cannot find req item!');
						}

						reqItem.fullfilled = true;
						reqItem.error = true;
						if (e.message) {
							reqItem.errorMessage = e.message;
						} else {
							reqItem.errorMessage = 'Unexpected error.';
						}
					})
			});
		}

		try {
			await Promise.all(requests.map((req) => req.promise));

			if (requests.map((req) => req.error).length > 0) {
				const marshaled = requests.map((req) => {
					delete req.promise;
					return req;
				});
				return message(form, marshaled, {
					status: 500
				});
			}

			return message(form, 'Posted!');
		} catch (e) {
			logger.error(e);
			setError(form, 'Failed to upload some files.');
			return fail(400, { form });
		}
	}
};
