import { error, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { Logger } from '$lib/logger';
import { auth } from '$lib/server/services/auth';
import { getMinioUrl } from '$lib/server/services/storage';
import { toSnake } from '$lib/utils';

const logger = new Logger('Service::Hooks');
const apiLogger = new Logger('Service::API');
let killing = false;

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
		const minioUrl = getMinioUrl();
		const internalUrl = new URL(event.url.pathname + event.url.search, minioUrl);

		const headers = new Headers(event.request.headers);
		headers.delete('connection');

		try {
			// Make the fetch request to the external service
			const proxyResponse = await fetch(internalUrl.toString(), {
				method: event.request.method,
				headers: headers,
				body: event.request.body, // Forward the request body
				// @ts-ignore
				duplex: 'half' // Needed for streaming request bodies (e.g., POST requests)
			});

			// Return the response from the external service directly
			return proxyResponse;
		} catch (err) {
			console.error('Proxy request failed:', err);
			throw error(500, 'Failed to proxy request.');
		}
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
