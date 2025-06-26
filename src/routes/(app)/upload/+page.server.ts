import { fail, message, setError, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { schema } from './schema';

export const load = async () => {
	return {
		form: await superValidate({}, valibot(schema))
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const promises = [];

		for (const file of form.data.attachments) {
			promises.push(locals.storage.upload(file));
		}

		try {
			await Promise.all(promises);

			return message(form, 'Posted!');
		} catch (e) {
			console.error(e);
			setError(form, 'Failed to upload some files.');
			return fail(400, { form });
		}
	}
};
