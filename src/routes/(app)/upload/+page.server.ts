import { createHash, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { uploadQueue } from '$lib/server/queues';
import { getTempDir } from '$lib/server/upload';
import { schema } from './schema';

export const load = async () => {
	return {
		form: await superValidate({}, valibot(schema))
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, valibot(schema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const tempDir = getTempDir();

		for (const file of form.data.attachments) {
			const hash = createHash('sha256');
			const bufferArray = await file.arrayBuffer();
			const buffer = Buffer.from(bufferArray);
			hash.update(buffer);
			const originalChecksum = hash.digest('hex');
			const uniqueSuffix = randomBytes(16).toString('hex');
			const uniqueFileName = `${Date.now()}-${uniqueSuffix}-${file.name}`;
			const tempFilePath = path.join(tempDir, uniqueFileName);
			await writeFile(tempFilePath, Buffer.from(buffer));
			const originalFileName = file.name;

			uploadQueue.add(file.name, { tempFilePath, originalChecksum, originalFileName });
		}

		return message(form, 'Posted!');
	}
};
