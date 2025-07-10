import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import mime from 'mime-types';
import { uploadQueue } from '$lib/server/queues';

import { StorageService } from '$lib/server/services/storage';

/**
 * Sets up a worker to process file upload jobs from the uploadQueue.
 *
 * This function sets up a worker that processes jobs from the uploadQueue. Each job involves reading a file from a
 * temporary path, verifying its integrity by comparing checksums, and then uploading the file to the storage service.
 * The worker updates the job's progress at various stages and logs relevant information. If an error occurs during
 * processing, it is logged and rethrown. After processing, the temporary file is deleted.
 *
 * @returns The worker instance that processes the upload jobs.
 */
export function uploadWorker() {
	const queue = uploadQueue();
	if (!queue) {
		return;
	}

	const worker = queue.setWorker(async (job) => {
		try {
			job.updateProgress(20);
			const fileBuffer = await readFile(job.data.tempFilePath);
			const mimeType = mime.lookup(job.data.tempFilePath) || 'application/octet-stream';

			queue.logger.info(`Veryfing file integrity for ${job.data.originalFileName}`);

			const hash = createHash('sha256');
			hash.update(fileBuffer);
			const readChecksum = hash.digest('hex');

			job.updateProgress(40);

			if (job.data.originalChecksum !== readChecksum) {
				throw new Error('File corruption detected! Checksums do not match.');
			}

			queue.logger.info(`Integrity verified for ${job.data.originalFileName}`);

			queue.logger.info(`Uploading ${job.data.originalFileName} (${mimeType})`);

			const file = new File([fileBuffer], job.data.originalFileName, { type: mimeType });
			job.updateProgress(60);

			const storage = new StorageService(job.data.user);

			try {
				storage.upload(file);
				job.updateProgress(80);
			} catch (e) {
				queue.logger.error('Failed to upload file', e);
				throw e;
			}

			return;
		} catch (e) {
			queue.logger.error(e);
			throw e;
		} finally {
			await unlink(job.data.tempFilePath);
			job.updateProgress(100);
		}
	});

	return worker;
}
