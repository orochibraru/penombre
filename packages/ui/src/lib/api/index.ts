import createClient, { type Middleware } from "openapi-fetch";
import { browser } from "$app/environment";
import { page } from "$app/state";
import { env } from "$env/dynamic/public";
import type { components, paths } from "./schema";

export const apiUrl = env.PUBLIC_API_URL || "http://localhost:8080";

export const authCookieName = "better-auth.session_token";

export function getAuthHeaders(cookie?: string): Headers {
	const headers: Headers = new Headers();
	if (cookie) {
		headers.set("Cookie", `${authCookieName}=${cookie}`);
	} else if (browser) {
		const match = document.cookie.match(
			new RegExp(`(^| )${authCookieName}=([^;]+)`),
		);
		if (match) {
			headers.set("Cookie", `${authCookieName}=${match[2]}`);
		}
	}
	return headers;
}

function buildMiddleware(cookie: string): Middleware {
	return {
		async onRequest({ request }) {
			const headers = getAuthHeaders(cookie);
			for (const [key, value] of headers.entries()) {
				request.headers.set(key, value);
			}
			return request;
		},
	};
}

export function getApiClient() {
	if (!browser) {
		throw new Error("getApiClient can only be used in the browser");
	}

	if (!page.data.authCookie) {
		throw new Error("No auth cookie found in page data");
	}

	const authMiddleware = buildMiddleware(page.data.authCookie);

	const client = createClient<paths>({
		baseUrl: apiUrl,
		credentials: "include",
	});

	client.use(authMiddleware);
	return client;
}

export function getServerSideApi(cookie: string) {
	if (browser) {
		throw new Error("getServerSideApi can only be used on the server");
	}
	const authMiddleware = buildMiddleware(cookie);

	const client = createClient<paths>({
		baseUrl: apiUrl,
	});

	client.use(authMiddleware);
	return client;
}

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

const defaultErrorMessage = "An unexpected error occured.";

export function apiError<T>(
	code: number,
	message = defaultErrorMessage,
	// biome-ignore lint/suspicious/noExplicitAny: This needs to be any error
	details?: any,
): ApiResponse<T> {
	let finalMessage = message;
	if (code >= 401 && code <= 403 && message === defaultErrorMessage) {
		finalMessage = "You don't have access.";
	}

	console.error("API Error", {
		code,
		message,
		details,
	});

	return {
		err: {
			code,
			message: finalMessage,
		},
		data: undefined,
	};
}

export function apiSuccess<T>(data: T): ApiResponse<T> {
	return {
		err: undefined,
		data,
	};
}

export type UserSession = components["schemas"]["Session"];
export type User = components["schemas"]["User"];
export type Bucket = string;
export type ObjectItem =
	paths["/api/storage/objects/item/{item}"]["get"]["responses"]["200"]["content"]["application/json"];
export type ObjectList =
	paths["/api/storage/objects"]["get"]["responses"]["200"]["content"]["application/json"];
export type UploadResult =
	paths["/api/storage/objects"]["post"]["responses"]["200"]["content"]["application/json"];
export type BaseUploadBody =
	paths["/api/storage/objects"]["post"]["requestBody"]["content"]["application/json"];
export type UploadBody =
	paths["/api/storage/objects"]["post"]["requestBody"]["content"]["application/json"];
