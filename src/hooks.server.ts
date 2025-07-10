import { createHash } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Worker } from 'bullmq';
import mime from 'mime-types';
import { building, dev } from '$app/environment';
import { bridge } from '$lib/client/api';
import { Logger } from '$lib/logger';
import { SENTRY_DSN } from '$lib/otel';
import { type UploadQueueJob, uploadQueue } from '$lib/server/queues';
import { auth } from '$lib/server/services/auth';
import { getMinioUrl } from '$lib/server/services/storage';
import { toSnake } from '$lib/utils';

if (!building && !dev) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: 'production',
		tracesSampleRate: 1.0
	});
}

const logger = new Logger('Service::Hooks');
const apiLogger = new Logger('Service::API');
let killing = false;

let worker: Worker<UploadQueueJob> | null;

const errorHandler: HandleServerError = ({ error, event, status }) => {
	if (status === 404) {
		return;
	}
	const errorId = crypto.randomUUID();

	event.locals.error = error?.toString() ?? '';
	if (error instanceof Error) {
		event.locals.errorStackTrace = error.stack ?? '';
	} else {
		event.locals.errorStackTrace = '';
	}

	event.locals.errorId = errorId;

	logger.error(errorId, event.url, status, error);

	Sentry.captureException(error, {
		extra: {
			event,
			errorId,
			status
		}
	});

	return {
		message: `An unexpected error occurred: ${JSON.stringify(error)}`,
		status,
		errorId
	};
};

export const handleError = handleErrorWithSentry(errorHandler);

const preHandler: Handle = async ({ event, resolve }) => {
	const authStatus = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!authStatus) {
		return resolve(event);
	}

	event.locals.user = authStatus.user;

	event.locals.authCookie = event.request.headers.get('cookie') ?? '';

	event.locals.logger = new Logger('Service::Pages');

	const { api } = bridge(event.url, event.locals.authCookie);

	if (!worker) {
		worker = uploadQueue.setWorker(async (job) => {
			const jobData = job.data as UploadQueueJob;
			try {
				job.updateProgress(10);
				uploadQueue.logger.debug(jobData);
				const fileBuffer = await readFile(jobData.tempFilePath);
				const mimeType = mime.lookup(jobData.tempFilePath) || 'application/octet-stream';

				uploadQueue.logger.info(`Veryfing file integrity for ${jobData.originalFileName}`);

				const hash = createHash('sha256');
				hash.update(fileBuffer);
				const readChecksum = hash.digest('hex');

				if (jobData.originalChecksum !== readChecksum) {
					throw new Error('File corruption detected! Checksums do not match.');
				}

				uploadQueue.logger.info(`Integrity verified for ${jobData.originalFileName}`);

				uploadQueue.logger.info(`Uploading ${jobData.originalFileName} (${mimeType})`);

				const file = new File([fileBuffer], jobData.originalFileName, { type: mimeType });

				const { data, error } = await api.v1.storage.objects.post({ file });

				job.updateProgress(100);
				if (error) {
					throw error;
				}

				job.updateProgress(100);
				return data;
			} catch (e) {
				uploadQueue.logger.error(e);
				throw e;
			} finally {
				await unlink(jobData.tempFilePath);
			}
		});
	}

	if (worker && !worker.isRunning()) {
		try {
			worker.run();
		} catch (e) {
			event.locals.logger.error('Failed to restart upload queue worker', e);
		}
	}

	// Proxy for signed urls
	const userBucket = toSnake(event.locals.user.name);
	if (event.url.pathname.startsWith(`/${userBucket}/`)) {
		const internalUrl = new URL(event.url.pathname + event.url.search, getMinioUrl());

		return event.fetch(internalUrl, {
			headers: event.request.headers,
			method: event.request.method,
			body: event.request.body
		});
	}

	return resolve(event);
};

const logHandler: Handle = async ({ event, resolve }) => {
	let logHandler: Logger = logger;

	if (event.url.pathname.includes('.well-known') || event.url.pathname.startsWith('/dev-sw')) {
		// Noise
		return resolve(event);
	}

	if (event.url.pathname.startsWith('/api')) {
		logHandler = apiLogger;
	}

	const startTime: Date = new Date();

	logHandler.http({
		req: event.request,
		res: new Response(),
		duration: 0,
		url: event.url,
		type: 'pre'
	});

	const resolution = await resolve(event);

	const endTime: Date = new Date();

	const duration: number = endTime.getTime() - startTime.getTime();

	logHandler.http({
		req: event.request,
		res: resolution,
		duration,
		url: event.url,
		type: 'post'
	});

	return resolution;
};

export const handle: Handle = sequence(sentryHandle(), logHandler, preHandler);

function kill(reason: string) {
	if (killing) {
		return;
	}

	killing = true;

	logger.info(`Shutting down, reason: ${reason}.`);

	process.exit(0);
}

process.on('sveltekit:shutdown', (reason) => kill(reason));
process.on('SIGTERM', () => kill('SIGTERM'));
process.on('SIGINT', () => kill('SIGINT'));
