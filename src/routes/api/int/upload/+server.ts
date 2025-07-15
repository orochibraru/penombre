import { createHash, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { QueueEventsListener } from 'bullmq';
import { actionResult, setMessage, superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { uploadSchema } from '$lib/schemas/upload';
import { type UploadQueueJob, uploadQueue } from '$lib/server/queues';
import { getTempDir } from '$lib/server/upload';

export const POST = async ({ request, locals }) => {
	const form = await superValidate(request, valibot(uploadSchema));

	if (!form.valid) {
		return actionResult('failure', { form });
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
				return actionResult('failure', { message: e.message });
			}

			return actionResult('failure', { message: 'An unexpected error occurred.' });
		}
	}

	try {
		await Promise.all(filePromises);
	} catch (e) {
		locals.logger.error('Failed to write temp files', e);
		return actionResult('failure', { message: 'Failed to write temporary files.' });
	}

	const queue = uploadQueue();

	try {
		await queue?.addBulk(queueJobs);
	} catch (e) {
		locals.logger.error(e);
		return actionResult('failure', { message: 'Failed to queue some jobs' });
	}

	setMessage(form, 'Files queued for upload.');
	return actionResult('success', { form });
};

export const GET = async ({ locals }) => {
	const logger = locals.logger;
	let closed = false;
	const queue = uploadQueue();
	if (!queue) {
		logger.error('Failed to get queue');
		return new Response(JSON.stringify({ error: 'Failed to get queue' }), {
			status: 500
		});
	}
	const queueEvents = queue.getEvents();

	let sendJobs: () => Promise<void> | undefined;

	const eventNames: (keyof QueueEventsListener)[] = [
		'completed',
		'failed',
		'added',
		'active',
		'delayed',
		'removed',
		'drained',
		'cleaned'
	];

	// Create a ReadableStream to send events
	const stream = new ReadableStream({
		async start(controller) {
			// Function to send the current job counts
			sendJobs = async () => {
				if (closed) {
					return;
				}

				try {
					const jobs = await queue.listJobs();
					if (!closed) {
						controller.enqueue(`data: ${JSON.stringify(jobs)}\n\n`);
					}
				} catch (e) {
					if (!closed) {
						logger.error('Error sending queue jobs:', e);
						controller.close();
						closed = true;
					}
				}
			};

			// Send initial data immediately on connection
			await sendJobs();

			// Set up event listeners for any change in the queue

			for (const eventName of eventNames) {
				queueEvents.on(eventName, sendJobs);
			}
		},
		cancel() {
			closed = true;

			// Important: Remove listeners to prevent memory leaks on the server
			if (sendJobs) {
				for (const eventName of eventNames) {
					queueEvents.removeListener(eventName, sendJobs);
				}
			}
			logger.debug('Client disconnected. SSE stream closed and listeners removed.');
		}
	});

	// Return the stream with appropriate headers for SSE
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

export const DELETE = async ({ locals }) => {
	const logger = locals.logger;
	const queue = uploadQueue();

	if (!queue) {
		logger.error('Failed to get queue');
		return new Response(JSON.stringify({ error: 'Failed to get queue' }), {
			status: 500
		});
	}

	logger.debug('Draining up upload queue');

	try {
		await queue.drain();
	} catch (e) {
		logger.error('Failed to drain upload queue', e);
		return new Response(JSON.stringify({ error: 'Failed to cleanup queue.' }), {
			status: 500
		});
	}

	return new Response(null, {
		status: 200
	});
};
