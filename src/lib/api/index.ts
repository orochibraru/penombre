import createClient, { type Middleware } from 'openapi-fetch';
import { browser } from '$app/environment';
import { getAuthToken } from '$lib/auth';
import type { components, paths } from './schema';

const client = createClient<paths>();

function sleep(amount: number) {
	return new Promise((resolve) => setTimeout(resolve, amount));
}

const authMiddleware: Middleware = {
	async onRequest({ request }) {
		while (!browser) {
			await sleep(100); // wait for browser to be ready
		}
		const csrfToken = getAuthToken();
		if (csrfToken) {
			request.headers.set('X-CSRF-Token', csrfToken);
		}
		return request;
	}
};

client.use(authMiddleware);

export const api = client;

export type ApiError = {
	code: number;
	message: string;
};

export type ApiResponse<T> =
	| {
			data: T;
			err: undefined;
	  }
	| {
			data: undefined;
			err: ApiError;
	  };

const defaultErrorMessage = 'An unexpected error occured.';

export function apiError<T>(
	code: number,
	message = defaultErrorMessage,
	// biome-ignore lint/suspicious/noExplicitAny: This needs to be any error
	details?: any
): ApiResponse<T> {
	let finalMessage = message;
	if (code >= 401 && code <= 403 && message === defaultErrorMessage) {
		finalMessage = "You don't have access.";
	}

	console.error('API Error', {
		code,
		message,
		details
	});

	return {
		err: {
			code,
			message: finalMessage
		},
		data: undefined
	};
}

export function apiSuccess<T>(data: T): ApiResponse<T> {
	return {
		err: undefined,
		data
	};
}

export type UserSession = components['schemas']['UserSession'];
export type User = components['schemas']['User'];
export type Providers = components['schemas']['Providers'];
export type Bucket = components['schemas']['Bucket'];
export type ObjectItem = components['schemas']['ObjectItem'];
export type ObjectList = components['schemas']['ObjectList'];
export type UploadResult = components['schemas']['UploadResult'];
export type BaseUploadBody = Omit<components['schemas']['UploadBody'], 'metadata'>;
export type UploadBody = BaseUploadBody & {
	// biome-ignore lint/suspicious/noExplicitAny: This is already annoying enough as it is
	metadata: Map<string, any>;
};
