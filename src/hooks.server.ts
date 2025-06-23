import { env } from '$env/dynamic/private';
import { auth } from '$lib/auth';
import { green, Log } from '@kitql/helpers';
import { error, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import NodeCache from 'node-cache';

const logger = new Log('Hooks');
let killing = false;

let cache: NodeCache | null;

export const init = () => {
	logger.info('Initializing cache...');
	cache = new NodeCache();
};

export const handleError: HandleServerError = ({ error, event }) => {
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

const generalHandler: Handle = async ({ event, resolve }) => {
	if (!cache) {
		return error(500, 'Failed to init cache');
	}
	event.locals.cache = cache;
	logger.info(`${green(event.request.method)} ${event.url.href}`);
	event.locals.cacheBypass = !!env.CACHE_BYPASS;

	return resolve(event);
};

/**
 * Initialize the Auth Service and assign it to the app's locals
 */
const authHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth });
};

export const handle: Handle = sequence(generalHandler, authHandler);

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
