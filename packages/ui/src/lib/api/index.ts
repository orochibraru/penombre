import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export const authCookieName = "better-auth.session_token";

type ApiClientProps = {
	fetch?: typeof globalThis.fetch;
	url: URL;
	cookie?: string;
};

export function getApiClient(props: ApiClientProps) {
	// In SSR context (server-side), use internal localhost to avoid deadlock
	// but forward the original Host header so the API knows the real origin
	const isServer = typeof window === "undefined";
	const baseUrl = isServer ? "http://localhost:8080" : props.url.origin;

	const client = createClient<paths>({
		baseUrl,
		credentials: "include",
		fetch: props.fetch,
		// Forward headers in SSR so the API knows the real origin and has the cookies
		headers: isServer
			? {
					"X-Forwarded-Host": props.url.host,
					"X-Forwarded-Proto": props.url.protocol.replace(":", ""),
					// Forward cookies since cross-origin requests to localhost won't include them
					...(props.cookie ? { Cookie: props.cookie } : {}),
				}
			: undefined,
	});

	return {
		...client,
		url: props.url,
	};
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
