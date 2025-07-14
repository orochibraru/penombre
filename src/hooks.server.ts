import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { Logger } from '$lib/logger';
import { auth } from '$lib/server/services/auth';
import { getMinioUrl } from '$lib/server/services/storage';
import { uploadWorker } from '$lib/server/workers';
import { toSnake } from '$lib/utils';

const logger = new Logger('Service::Hooks');
const apiLogger = new Logger('Service::API');
let killing = false;

export const init = () => {
	if (!building) {
		const uploadWorkerInstance = uploadWorker();

		if (uploadWorkerInstance && !uploadWorkerInstance.isRunning()) {
			try {
				uploadWorkerInstance.run();
			} catch (e) {
				logger.error('Failed to start upload worker', e);
			}
		}
	}
};

export const handleError: HandleServerError = ({ error, event, status }) => {
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

	return {
		message: `An unexpected error occurred: ${JSON.stringify(error)}`,
		status,
		errorId
	};
};

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

export const handle: Handle = sequence(logHandler, preHandler);

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
