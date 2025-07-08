import { building, dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Logger } from '$lib/logger';
import { SENTRY_DSN } from '$lib/otel';
import { auth } from '$lib/server/services/auth';
import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import { error, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import NodeCache from 'node-cache';

if (!building) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: dev ? 'development' : 'production',
		tracesSampleRate: 1.0
	});
}

const logger = new Logger('Service::Hooks');
const apiLogger = new Logger('Service::API');
let killing = false;

let cache: NodeCache | null;

export const init = () => {
	cache = new NodeCache();
};

const errorHandler: HandleServerError = ({ error, event }) => {
	const errorId = crypto.randomUUID();

	event.locals.error = error?.toString() ?? '';
	if (error instanceof Error) {
		event.locals.errorStackTrace = error.stack ?? '';
	} else {
		event.locals.errorStackTrace = '';
	}

	event.locals.errorId = errorId;

	const typedError = error as Error;

	logger.error(JSON.stringify(typedError));
	logger.error({
		url: event.request.url,
		message: typedError.message,
		errorId,
		stackTrace: typedError.stack,
		date: new Date().toISOString()
	});

	return {
		message: `An unexpected error occurred: ${typedError.message}`,
		errorId
	};
};

export const handleError = handleErrorWithSentry(errorHandler);

const preHandler: Handle = async ({ event, resolve }) => {
	if (!cache) {
		return error(500, 'Failed to init cache');
	}
	event.locals.cache = cache;
	event.locals.cacheBypass = !!env.CACHE_BYPASS;

	const authStatus = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!authStatus) {
		return resolve(event);
	}

	event.locals.user = authStatus.user;

	event.locals.authCookie = event.request.headers.get('cookie') ?? '';

	event.locals.logger = new Logger('Service::Pages');

	return resolve(event);
};

const logHandler: Handle = async ({ event, resolve }) => {
	let logHandler: Logger = logger;

	if (event.url.pathname.includes('.well-known')) {
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
