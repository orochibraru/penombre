import { createHash, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { type UploadQueueJob, uploadQueue } from '$lib/server/queues';
import { getTempDir } from '$lib/server/upload';
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
		const tempDir = getTempDir();

		type QueueJob = {
			name: string;
			data: UploadQueueJob;
		}[];

		const queueJobs: QueueJob = [];

		const filePromises: Promise<void>[] = [];

		for (const file of form.data.attachments) {
			try {
				const hash = createHash('sha256');
				const bufferArray = await file.arrayBuffer();
				const buffer = Buffer.from(bufferArray);
				hash.update(buffer);
				const originalChecksum = hash.digest('hex');
				const uniqueSuffix = randomBytes(16).toString('hex');
				const uniqueFileName = `${Date.now()}-${uniqueSuffix}-${file.name}`;
				const tempFilePath = path.join(tempDir, uniqueFileName);
				const writeJob = writeFile(tempFilePath, Buffer.from(buffer));
				const originalFileName = file.name;

				filePromises.push(writeJob);

				queueJobs.push({
					name: file.name,
					data: {
						user: locals.user,
						tempFilePath,
						originalChecksum,
						originalFileName
					}
				});
			} catch (e) {
				locals.logger.error('Failed to queue file', file.name);
				if (e instanceof Error) {
					return fail(500, { message: e.message });
				}

				return fail(500, { message: 'An unexpected error occurred.' });
			}
		}

		try {
			await Promise.all(filePromises);
		} catch (e) {
			locals.logger.error('Failed to write temp files', e);
			return fail(500, { message: 'Failed to write temporary files.' });
		}

		const queue = uploadQueue();

		try {
			await queue?.addBulk(queueJobs);
		} catch (e) {
			locals.logger.error(e);
			return fail(500, { message: 'Failed to queue some jobs' });
		}

		return message(form, 'Posted!');
	}
};
