import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import type { HandleClientError } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { SENTRY_DSN } from '$lib/otel';

if (!building && !dev) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: 'production',
		tracesSampleRate: 1.0,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		integrations: [Sentry.replayIntegration()]
	});
}

const clientErrorHandler: HandleClientError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	console.error('An error occurred on the client side:', error, event, message);

	Sentry.captureException(error, {
		extra: {
			event,
			errorId,
			status
		}
	});

	return {
		message: 'Whoops!',
		errorId
	};
};

export const handleError = handleErrorWithSentry(clientErrorHandler);
